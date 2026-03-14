"""
Dashboard Analytics - Real-time KPIs and metrics calculation
"""

from datetime import datetime, date, timedelta
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import (
    Order, OrderItem, Product, Staff, Customer,
    Inventory, Ingredient, InventoryExpiry, Waste
)


def get_today_sales() -> float:
    """Get today's total sales"""
    try:
        db = get_db_session()
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        orders = db.query(Order).filter(
            Order.order_datetime >= today_start,
            Order.order_datetime <= today_end,
            Order.order_status.in_(['completed', 'paid'])
        ).all()
        
        total = sum(o.total_amount for o in orders)
        db.close()
        return round(total, 2)
    except Exception as e:
        logger.error(f"Error calculating today's sales: {e}")
        return 0.0


def get_today_orders() -> int:
    """Get today's order count"""
    try:
        db = get_db_session()
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        count = db.query(Order).filter(
            Order.order_datetime >= today_start,
            Order.order_datetime <= today_end
        ).count()
        
        db.close()
        return count
    except Exception as e:
        logger.error(f"Error calculating today's orders: {e}")
        return 0


def get_active_staff_count() -> tuple:
    """Get active staff count and total staff count"""
    try:
        db = get_db_session()
        total = db.query(Staff).count()
        active = db.query(Staff).filter(Staff.status == 'active').count()
        db.close()
        return (active, total)
    except Exception as e:
        logger.error(f"Error calculating staff count: {e}")
        return (0, 0)


def get_inventory_alerts() -> int:
    """Get count of inventory items that need attention"""
    try:
        db = get_db_session()
        
        # Low stock alerts
        low_stock = db.query(Inventory).filter(
            Inventory.quantity <= Inventory.reorder_level,
            Inventory.status == 'active'
        ).count()
        
        # Expiring soon alerts (within 7 days)
        today = date.today()
        expiry_date = today + timedelta(days=7)
        
        expiring = db.query(InventoryExpiry).filter(
            InventoryExpiry.expiry_date <= expiry_date,
            InventoryExpiry.expiry_date >= today,
            InventoryExpiry.is_expired == False
        ).count()
        
        db.close()
        return low_stock + expiring
    except Exception as e:
        logger.error(f"Error calculating inventory alerts: {e}")
        return 0


def get_recent_activities(limit: int = 10) -> list:
    """Get recent activities for dashboard"""
    try:
        db = get_db_session()
        activities = []
        
        # Recent orders
        recent_orders = db.query(Order).order_by(
            Order.order_datetime.desc()
        ).limit(limit).all()
        
        for order in recent_orders:
            customer_name = "Walk-in"
            if order.customer:
                customer_name = f"{order.customer.first_name} {order.customer.last_name}"
            
            activities.append({
                'type': 'order',
                'message': f"New order #{order.order_id} - ${order.total_amount:.2f} from {customer_name}",
                'time': order.order_datetime,
                'icon': '💰'
            })
        
        # Sort by time
        activities.sort(key=lambda x: x['time'], reverse=True)
        
        db.close()
        return activities[:limit]
    except Exception as e:
        logger.error(f"Error getting recent activities: {e}")
        return []


def get_top_products(limit: int = 5) -> list:
    """Get top selling products"""
    try:
        db = get_db_session()
        
        # Get order items and group by product
        from sqlalchemy import func
        
        top_products = db.query(
            Product.name,
            func.sum(OrderItem.quantity).label('total_quantity'),
            func.sum(OrderItem.total_price).label('total_revenue')
        ).join(
            OrderItem, Product.product_id == OrderItem.product_id
        ).join(
            Order, OrderItem.order_id == Order.order_id
        ).filter(
            Order.order_status.in_(['completed', 'paid'])
        ).group_by(
            Product.product_id, Product.name
        ).order_by(
            func.sum(OrderItem.total_price).desc()
        ).limit(limit).all()
        
        db.close()
        return [
            {
                'name': name,
                'quantity': int(qty),
                'revenue': round(rev, 2)
            }
            for name, qty, rev in top_products
        ]
    except Exception as e:
        logger.error(f"Error getting top products: {e}")
        return []


def get_sales_trend(days: int = 7) -> list:
    """Get sales trend for last N days"""
    try:
        db = get_db_session()
        trends = []
        
        for i in range(days - 1, -1, -1):
            day = date.today() - timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())
            
            orders = db.query(Order).filter(
                Order.order_datetime >= day_start,
                Order.order_datetime <= day_end,
                Order.order_status.in_(['completed', 'paid'])
            ).all()
            
            total = sum(o.total_amount for o in orders)
            trends.append({
                'date': day,
                'sales': round(total, 2),
                'orders': len(orders)
            })
        
        db.close()
        return trends
    except Exception as e:
        logger.error(f"Error getting sales trend: {e}")
        return []


def get_recent_orders(limit: int = 8) -> list:
    """Get recent orders for dashboard table."""
    try:
        db = get_db_session()
        orders = (
            db.query(Order)
            .order_by(Order.order_datetime.desc())
            .limit(limit)
            .all()
        )
        rows = []
        for order in orders:
            customer_name = "Walk-in"
            if order.customer:
                customer_name = f"{order.customer.first_name} {order.customer.last_name}"
            rows.append(
                {
                    "order_id": order.order_id,
                    "customer": customer_name,
                    "amount": round(order.total_amount, 2),
                    "status": order.order_status,
                    "time": order.order_datetime,
                }
            )
        db.close()
        return rows
    except Exception as e:
        logger.error(f"Error loading recent orders: {e}")
        return []

