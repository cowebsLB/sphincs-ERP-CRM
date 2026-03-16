"""
Database connection management
"""
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from pathlib import Path
from typing import Optional
from loguru import logger
from src.config.settings import get_settings


class DatabaseManager:
    """Manage database connections"""
    
    def __init__(self):
        """Initialize database manager"""
        self.settings = get_settings()
        self.engine: Optional[create_engine] = None
        self.SessionLocal: Optional[sessionmaker] = None
        self._initialize_engine()
    
    def _initialize_engine(self):
        """Initialize SQLAlchemy engine"""
        db_path = Path(self.settings.get('Database', 'local_db_path'))
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # SQLite connection string
        db_url = f"sqlite:///{db_path}"
        
        # Create engine with SQLite-specific settings
        self.engine = create_engine(
            db_url,
            connect_args={
                "check_same_thread": False,  # Allow multi-threaded access
                "timeout": 20,  # Connection timeout
            },
            poolclass=StaticPool,  # SQLite doesn't need connection pooling
            echo=False,  # Set to True for SQL query logging
        )
        
        # Enable WAL mode for better concurrency
        @event.listens_for(self.engine, "connect")
        def set_sqlite_pragma(dbapi_conn, connection_record):
            """Set SQLite pragmas for better performance"""
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=10000")
            cursor.execute("PRAGMA temp_store=MEMORY")
            cursor.close()
        
        # Create session factory
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        
        logger.info(f"Database engine initialized: {db_path}")
    
    def get_session(self) -> Session:
        """Get database session"""
        if self.SessionLocal is None:
            raise RuntimeError("Database not initialized")
        return self.SessionLocal()
    
    def create_tables(self):
        """Create all database tables"""
        # Import models here to avoid circular imports
        from src.database.models import Base
        
        Base.metadata.create_all(bind=self.engine)
        self._ensure_performance_indexes()
        logger.info("Database tables created")

    def _ensure_performance_indexes(self):
        """Create SQLite indexes for high-traffic dashboard queries."""
        if not self.engine:
            return

        index_statements = (
            "CREATE INDEX IF NOT EXISTS idx_orders_status_datetime ON orders(order_status, order_datetime)",
            "CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)",
            "CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)",
            "CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)",
            "CREATE INDEX IF NOT EXISTS idx_inventory_status_qty_reorder ON inventory(status, quantity, reorder_level)",
            "CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date_state ON inventory_expiry(expiry_date, is_expired)",
        )

        with self.engine.begin() as conn:
            for statement in index_statements:
                conn.execute(text(statement))
    
    def close(self):
        """Close database connections"""
        if self.engine:
            self.engine.dispose()
            logger.info("Database connections closed")


# Global database manager instance
_db_manager: Optional[DatabaseManager] = None


def get_db_manager() -> DatabaseManager:
    """Get global database manager instance"""
    global _db_manager
    if _db_manager is None:
        _db_manager = DatabaseManager()
    return _db_manager


def get_db_session() -> Session:
    """Get database session (convenience function)"""
    return get_db_manager().get_session()

