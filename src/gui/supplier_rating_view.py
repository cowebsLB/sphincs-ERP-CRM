"""
Supplier Rating View - Rate and review suppliers
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QDialog, QComboBox,
    QMessageBox, QFormLayout, QSpinBox, QTextEdit, QCheckBox
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor
from loguru import logger
from src.database.connection import get_db_session
from src.database.models import SupplierRating, Supplier, PurchaseOrder


class SupplierRatingView(QWidget):
    """Supplier Rating View"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setup_ui()
        self.load_ratings()
    
    def setup_ui(self):
        """Setup supplier rating UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Supplier Ratings")
        title.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        # Add Rating button
        add_btn = QPushButton("Add Rating")
        add_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-size: 14px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #1D66EA;
            }
        """)
        add_btn.clicked.connect(self.handle_add_rating)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Summary cards
        summary_layout = QHBoxLayout()
        summary_layout.setSpacing(16)
        
        self.avg_rating_card = self.create_summary_card("Average Rating", "0.0 ⭐")
        self.total_ratings_card = self.create_summary_card("Total Ratings", "0")
        self.top_supplier_card = self.create_summary_card("Top Rated Supplier", "-")
        
        summary_layout.addWidget(self.avg_rating_card)
        summary_layout.addWidget(self.total_ratings_card)
        summary_layout.addWidget(self.top_supplier_card)
        
        layout.addLayout(summary_layout)
        layout.addSpacing(24)
        
        # Filters
        filter_layout = QHBoxLayout()
        filter_layout.setSpacing(12)
        
        filter_layout.addWidget(QLabel("Supplier:"))
        self.supplier_combo = QComboBox()
        self.supplier_combo.addItem("All Suppliers")
        self.load_suppliers()
        filter_layout.addWidget(self.supplier_combo)
        
        filter_btn = QPushButton("Filter")
        filter_btn.setStyleSheet("""
            QPushButton {
                background-color: #5D6F8B;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
            }
        """)
        filter_btn.clicked.connect(self.load_ratings)
        filter_layout.addWidget(filter_btn)
        
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        layout.addSpacing(16)
        
        # Ratings table
        self.ratings_table = QTableWidget()
        self.ratings_table.setColumnCount(8)
        self.ratings_table.setHorizontalHeaderLabels([
            "Date", "Supplier", "PO #", "Overall", "On-Time", "Quality", "Price", "Communication"
        ])
        self.ratings_table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                gridline-color: #EDF3FC;
            }
            QHeaderView::section {
                background-color: #F9FAFB;
                padding: 10px;
                border: none;
                border-bottom: 2px solid #C8D4E8;
                font-weight: 600;
            }
        """)
        self.ratings_table.horizontalHeader().setStretchLastSection(True)
        self.ratings_table.setAlternatingRowColors(True)
        layout.addWidget(self.ratings_table)
    
    def create_summary_card(self, title: str, value: str) -> QWidget:
        """Create a summary card"""
        from PyQt6.QtWidgets import QFrame
        
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: white;
                border: 1px solid #C8D4E8;
                border-radius: 8px;
                padding: 20px;
            }
        """)
        layout = QVBoxLayout(card)
        layout.setSpacing(8)
        
        title_label = QLabel(title)
        title_label.setStyleSheet("""
            color: #5D6F8B;
            font-size: 14px;
            font-weight: 500;
        """)
        layout.addWidget(title_label)
        
        value_label = QLabel(value)
        value_label.setStyleSheet("""
            color: #162640;
            font-size: 24px;
            font-weight: 700;
        """)
        layout.addWidget(value_label)
        
        return card
    
    def load_suppliers(self):
        """Load suppliers into combo"""
        try:
            db = get_db_session()
            suppliers = db.query(Supplier).filter(Supplier.status == 'active').all()
            for supplier in suppliers:
                self.supplier_combo.addItem(supplier.name, supplier.supplier_id)
            db.close()
        except Exception as e:
            logger.error(f"Error loading suppliers: {e}")
    
    def load_ratings(self):
        """Load supplier ratings"""
        try:
            db = get_db_session()
            
            query = db.query(SupplierRating)
            
            supplier_filter = self.supplier_combo.currentData()
            if supplier_filter:
                query = query.filter(SupplierRating.supplier_id == supplier_filter)
            
            ratings = query.order_by(SupplierRating.rating_date.desc()).all()
            
            self.ratings_table.setRowCount(len(ratings))
            total_rating = 0.0
            
            for row, rating in enumerate(ratings):
                self.ratings_table.setItem(row, 0, QTableWidgetItem(
                    rating.rating_date.strftime("%Y-%m-%d")
                ))
                self.ratings_table.setItem(row, 1, QTableWidgetItem(rating.supplier.name))
                
                po_num = f"#{rating.purchase_order_id}" if rating.purchase_order_id else "-"
                self.ratings_table.setItem(row, 2, QTableWidgetItem(po_num))
                
                # Overall rating with stars
                stars = "⭐" * rating.rating
                self.ratings_table.setItem(row, 3, QTableWidgetItem(f"{rating.rating}/5 {stars}"))
                
                # On-time delivery
                on_time = "✓" if rating.on_time_delivery else "✗"
                self.ratings_table.setItem(row, 4, QTableWidgetItem(on_time))
                
                # Quality rating
                quality = f"{rating.quality_rating}/5" if rating.quality_rating else "-"
                self.ratings_table.setItem(row, 5, QTableWidgetItem(quality))
                
                # Price rating
                price = f"{rating.price_rating}/5" if rating.price_rating else "-"
                self.ratings_table.setItem(row, 6, QTableWidgetItem(price))
                
                # Communication rating
                comm = f"{rating.communication_rating}/5" if rating.communication_rating else "-"
                self.ratings_table.setItem(row, 7, QTableWidgetItem(comm))
                
                total_rating += rating.rating
            
            # Update summary
            avg_rating = total_rating / len(ratings) if ratings else 0.0
            labels = self.avg_rating_card.findChildren(QLabel)
            if len(labels) >= 2:
                labels[1].setText(f"{avg_rating:.1f} ⭐")
            
            labels = self.total_ratings_card.findChildren(QLabel)
            if len(labels) >= 2:
                labels[1].setText(str(len(ratings)))
            
            # Top supplier
            if ratings:
                from sqlalchemy import func
                top_supplier = db.query(
                    Supplier.name,
                    func.avg(SupplierRating.rating).label('avg_rating')
                ).join(
                    SupplierRating, Supplier.supplier_id == SupplierRating.supplier_id
                ).group_by(
                    Supplier.supplier_id, Supplier.name
                ).order_by(
                    func.avg(SupplierRating.rating).desc()
                ).first()
                
                if top_supplier:
                    labels = self.top_supplier_card.findChildren(QLabel)
                    if len(labels) >= 2:
                        labels[1].setText(f"{top_supplier[0]} ({top_supplier[1]:.1f}⭐)")
            
            db.close()
        except Exception as e:
            logger.error(f"Error loading ratings: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load ratings: {str(e)}")
    
    def handle_add_rating(self):
        """Handle add rating"""
        dialog = AddSupplierRatingDialog(self.user_id, self)
        if dialog.exec():
            self.load_ratings()


class AddSupplierRatingDialog(QDialog):
    """Dialog for adding supplier rating"""
    
    def __init__(self, user_id: int, parent=None):
        super().__init__(parent)
        self.user_id = user_id
        self.setWindowTitle("Rate Supplier")
        self.setMinimumSize(450, 400)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup add rating UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(20, 20, 20, 20)
        
        form = QFormLayout()
        
        # Supplier selection
        self.supplier_combo = QComboBox()
        self.load_suppliers()
        form.addRow("Supplier:", self.supplier_combo)
        
        # Purchase Order (optional)
        self.po_combo = QComboBox()
        self.po_combo.addItem("None")
        form.addRow("Purchase Order (optional):", self.po_combo)
        
        # Overall rating
        self.rating_spin = QSpinBox()
        self.rating_spin.setMinimum(1)
        self.rating_spin.setMaximum(5)
        self.rating_spin.setValue(5)
        form.addRow("Overall Rating (1-5):", self.rating_spin)
        
        # On-time delivery
        self.on_time_check = QCheckBox()
        self.on_time_check.setChecked(True)
        form.addRow("On-Time Delivery:", self.on_time_check)
        
        # Quality rating
        self.quality_spin = QSpinBox()
        self.quality_spin.setMinimum(1)
        self.quality_spin.setMaximum(5)
        self.quality_spin.setValue(5)
        form.addRow("Quality Rating (1-5):", self.quality_spin)
        
        # Price rating
        self.price_spin = QSpinBox()
        self.price_spin.setMinimum(1)
        self.price_spin.setMaximum(5)
        self.price_spin.setValue(5)
        form.addRow("Price Rating (1-5):", self.price_spin)
        
        # Communication rating
        self.comm_spin = QSpinBox()
        self.comm_spin.setMinimum(1)
        self.comm_spin.setMaximum(5)
        self.comm_spin.setValue(5)
        form.addRow("Communication Rating (1-5):", self.comm_spin)
        
        # Notes
        self.notes_input = QTextEdit()
        self.notes_input.setMaximumHeight(80)
        form.addRow("Notes:", self.notes_input)
        
        layout.addLayout(form)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("Save")
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #2F7DFF;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
        """)
        save_btn.clicked.connect(self.handle_save)
        buttons_layout.addWidget(save_btn)
        
        layout.addLayout(buttons_layout)
    
    def load_suppliers(self):
        """Load suppliers"""
        try:
            db = get_db_session()
            suppliers = db.query(Supplier).filter(Supplier.status == 'active').all()
            for supplier in suppliers:
                self.supplier_combo.addItem(supplier.name, supplier.supplier_id)
            db.close()
        except Exception as e:
            logger.error(f"Error loading suppliers: {e}")
    
    def handle_save(self):
        """Save rating"""
        try:
            db = get_db_session()
            
            supplier_id = self.supplier_combo.currentData()
            if not supplier_id:
                QMessageBox.warning(self, "Warning", "Please select a supplier")
                return
            
            po_id = None
            if self.po_combo.currentIndex() > 0:
                po_id = self.po_combo.currentData()
            
            rating = SupplierRating(
                supplier_id=supplier_id,
                purchase_order_id=po_id,
                rating=self.rating_spin.value(),
                on_time_delivery=self.on_time_check.isChecked(),
                quality_rating=self.quality_spin.value(),
                price_rating=self.price_spin.value(),
                communication_rating=self.comm_spin.value(),
                notes=self.notes_input.toPlainText() or None
            )
            
            db.add(rating)
            db.commit()
            db.close()
            
            QMessageBox.information(self, "Success", "Rating added successfully")
            self.accept()
            
        except Exception as e:
            logger.error(f"Error saving rating: {e}")
            QMessageBox.critical(self, "Error", f"Failed to save rating: {str(e)}")

