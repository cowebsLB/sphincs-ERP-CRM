import {
  AlertSeverity,
  DispatchStatus,
  DistributionMovementType,
  GoodsReceiptStatus,
  InventoryReservationStatus,
  ItemStatus,
  LeadStatus,
  OpportunityStatus,
  PaymentStatus,
  Prisma,
  PrismaClient,
  PurchaseOrderStatus,
  StockAdjustmentStatus,
  StockAdjustmentType,
  StockReturnStatus,
  StockReturnType,
  StockTransferStatus,
  SupplierStatus
} from "@prisma/client";
import { hashPassword } from "../../src/common/security/password";

const ORG = "00000000-0000-0000-0000-000000000001";
const BR_MAIN = "00000000-0000-0000-0000-000000000101";
const BR_SECOND = "00000000-0000-0000-0000-000000000102";

const ITEM_WIDGET = "10000000-0000-0000-0000-000000000001";
const ITEM_BOLT = "10000000-0000-0000-0000-000000000002";
const ITEM_SVC = "10000000-0000-0000-0000-000000000003";

const SUP_A = "20000000-0000-0000-0000-000000000001";
const SUP_B = "20000000-0000-0000-0000-000000000002";

const LOC_WH_MAIN = "40000000-0000-0000-0000-000000000010";
const LOC_BIN_MAIN = "40000000-0000-0000-0000-000000000011";
const LOC_DOCK_SECOND = "40000000-0000-0000-0000-000000000020";

const PO1 = "50000000-0000-0000-0000-000000000001";
const POL1 = "50000000-0000-0000-0000-000000000011";
const POL2 = "50000000-0000-0000-0000-000000000012";

const CONTACT1 = "30000000-0000-0000-0000-000000000001";
const LEAD1 = "30000000-0000-0000-0000-000000000011";
const OPP1 = "30000000-0000-0000-0000-000000000021";

const GR1 = "60000000-0000-0000-0000-000000000001";
const GRL1 = "60000000-0000-0000-0000-000000000011";

const LOT1 = "70000000-0000-0000-0000-000000000001";
const LOTBAL1 = "70000000-0000-0000-0000-000000000011";

const STK_WIDGET_MAIN = "80000000-0000-0000-0000-000000000001";
const STK_BOLT_MAIN = "80000000-0000-0000-0000-000000000002";
const STK_WIDGET_SECOND = "80000000-0000-0000-0000-000000000010";

const MOV1 = "81000000-0000-0000-0000-000000000001";
const MOV2 = "81000000-0000-0000-0000-000000000002";

const ST1 = "82000000-0000-0000-0000-000000000001";
const STL1 = "82000000-0000-0000-0000-000000000011";

const ADJ1 = "83000000-0000-0000-0000-000000000001";
const ADJL1 = "83000000-0000-0000-0000-000000000011";

const DSP1 = "84000000-0000-0000-0000-000000000001";
const DSPL1 = "84000000-0000-0000-0000-000000000011";
const PICKJOB1 = "84000000-0000-0000-0000-000000000021";
const PICKLINE1 = "84000000-0000-0000-0000-000000000031";
const PACKJOB1 = "84000000-0000-0000-0000-000000000041";
const PACKLINE1 = "84000000-0000-0000-0000-000000000051";

const RTN1 = "85000000-0000-0000-0000-000000000001";
const RTNL1 = "85000000-0000-0000-0000-000000000011";

const RES1 = "86000000-0000-0000-0000-000000000001";
const RR1 = "87000000-0000-0000-0000-000000000001";
const ALERT1 = "88000000-0000-0000-0000-000000000001";
const AUD1 = "89000000-0000-0000-0000-000000000001";

const STAFF_USER = "00000000-0000-0000-0000-00000000a002";

export async function seedDemoGraph(prisma: PrismaClient, adminId: string): Promise<void> {
  const staffPasswordHash = await hashPassword("ChangeMe123!");

  const branchSecond = await prisma.branch.upsert({
    where: { id: BR_SECOND },
    update: { name: "Secondary Branch" },
    create: {
      id: BR_SECOND,
      organization_id: ORG,
      name: "Secondary Branch"
    }
  });

  const staffRole = await prisma.role.findUnique({ where: { name: "Staff" } });
  if (!staffRole) {
    throw new Error("Staff role missing; run baseline seed first");
  }

  await prisma.user.upsert({
    where: { email: "staff@sphincs.local" },
    update: {
      password_hash: staffPasswordHash,
      status: "ACTIVE",
      organization_id: ORG,
      branch_id: BR_MAIN
    },
    create: {
      id: STAFF_USER,
      organization_id: ORG,
      branch_id: BR_MAIN,
      email: "staff@sphincs.local",
      password_hash: staffPasswordHash,
      status: "ACTIVE"
    }
  });

  const staff = await prisma.user.findUniqueOrThrow({ where: { email: "staff@sphincs.local" } });
  await prisma.userRole.upsert({
    where: {
      user_id_role_id: { user_id: staff.id, role_id: staffRole.id }
    },
    update: {},
    create: { user_id: staff.id, role_id: staffRole.id }
  });

  await prisma.item.upsert({
    where: { id: ITEM_WIDGET },
    update: {
      name: "Demo Widget",
      sku: "SEED-SKU-WIDGET",
      status: ItemStatus.ACTIVE,
      cost_price: new Prisma.Decimal("12.5"),
      selling_price: new Prisma.Decimal("24.99"),
      quantity_on_hand: 0,
      track_inventory: true,
      is_service: false
    },
    create: {
      id: ITEM_WIDGET,
      organization_id: ORG,
      branch_id: BR_MAIN,
      name: "Demo Widget",
      sku: "SEED-SKU-WIDGET",
      status: ItemStatus.ACTIVE,
      cost_price: new Prisma.Decimal("12.5"),
      selling_price: new Prisma.Decimal("24.99"),
      track_inventory: true,
      is_service: false,
      created_by: adminId
    }
  });

  await prisma.item.upsert({
    where: { id: ITEM_BOLT },
    update: {
      name: "Demo Bolt Pack",
      sku: "SEED-SKU-BOLT",
      status: ItemStatus.ACTIVE,
      cost_price: new Prisma.Decimal("2"),
      selling_price: new Prisma.Decimal("4.5")
    },
    create: {
      id: ITEM_BOLT,
      organization_id: ORG,
      branch_id: BR_MAIN,
      name: "Demo Bolt Pack",
      sku: "SEED-SKU-BOLT",
      status: ItemStatus.ACTIVE,
      cost_price: new Prisma.Decimal("2"),
      selling_price: new Prisma.Decimal("4.5"),
      track_inventory: true,
      is_service: false,
      created_by: adminId
    }
  });

  await prisma.item.upsert({
    where: { id: ITEM_SVC },
    update: {
      name: "Demo Consulting Hour",
      sku: "SEED-SKU-SVC",
      status: ItemStatus.ACTIVE,
      track_inventory: false,
      is_service: true
    },
    create: {
      id: ITEM_SVC,
      organization_id: ORG,
      branch_id: BR_MAIN,
      name: "Demo Consulting Hour",
      sku: "SEED-SKU-SVC",
      status: ItemStatus.ACTIVE,
      track_inventory: false,
      is_service: true,
      created_by: adminId
    }
  });

  await prisma.supplier.upsert({
    where: { id: SUP_A },
    update: { name: "Acme Supplies", supplier_code: "SEED-SUP-ACME", status: SupplierStatus.ACTIVE },
    create: {
      id: SUP_A,
      organization_id: ORG,
      branch_id: BR_MAIN,
      name: "Acme Supplies",
      supplier_code: "SEED-SUP-ACME",
      status: SupplierStatus.ACTIVE,
      preferred_supplier: true,
      created_by: adminId
    }
  });

  await prisma.supplier.upsert({
    where: { id: SUP_B },
    update: { name: "Beta Components", supplier_code: "SEED-SUP-BETA", status: SupplierStatus.ACTIVE },
    create: {
      id: SUP_B,
      organization_id: ORG,
      branch_id: BR_MAIN,
      name: "Beta Components",
      supplier_code: "SEED-SUP-BETA",
      status: SupplierStatus.ACTIVE,
      created_by: adminId
    }
  });

  await prisma.warehouseLocation.upsert({
    where: { id: LOC_WH_MAIN },
    update: { name: "Main warehouse zone", location_type: "GENERAL" },
    create: {
      id: LOC_WH_MAIN,
      organization_id: ORG,
      branch_id: BR_MAIN,
      code: "SEED-WH-A",
      name: "Main warehouse zone",
      location_type: "GENERAL",
      is_active: true
    }
  });

  await prisma.warehouseLocation.upsert({
    where: { id: LOC_BIN_MAIN },
    update: { parent_location_id: LOC_WH_MAIN, location_type: "BIN" },
    create: {
      id: LOC_BIN_MAIN,
      organization_id: ORG,
      branch_id: BR_MAIN,
      parent_location_id: LOC_WH_MAIN,
      code: "SEED-BIN-01",
      name: "Pick face bin",
      location_type: "BIN",
      is_active: true
    }
  });

  await prisma.warehouseLocation.upsert({
    where: { id: LOC_DOCK_SECOND },
    update: { name: "Inbound dock" },
    create: {
      id: LOC_DOCK_SECOND,
      organization_id: ORG,
      branch_id: branchSecond.id,
      code: "SEED-DOCK-01",
      name: "Inbound dock",
      location_type: "DOCK",
      is_active: true
    }
  });

  const po = await prisma.purchaseOrder.upsert({
    where: { po_number: "SEED-DEMO-PO-001" },
    update: {
      status: PurchaseOrderStatus.APPROVED,
      payment_status: PaymentStatus.PAID,
      supplier_id: SUP_A,
      grand_total: 500,
      subtotal: 450,
      total_tax: 50,
      approved_by: adminId,
      approved_at: new Date()
    },
    create: {
      id: PO1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      po_number: "SEED-DEMO-PO-001",
      supplier_id: SUP_A,
      status: PurchaseOrderStatus.APPROVED,
      payment_status: PaymentStatus.PAID,
      subtotal: 450,
      total_tax: 50,
      total_discount: 0,
      grand_total: 500,
      approved_by: adminId,
      approved_at: new Date(),
      created_by: adminId
    }
  });

  await prisma.purchaseOrderLineItem.upsert({
    where: { id: POL1 },
    update: { quantity: 20, line_total: 250, unit_cost: 12.5 },
    create: {
      id: POL1,
      purchase_order_id: po.id,
      item_id: ITEM_WIDGET,
      quantity: 20,
      unit_cost: 12.5,
      line_total: 250,
      received_quantity: 0
    }
  });

  await prisma.purchaseOrderLineItem.upsert({
    where: { id: POL2 },
    update: { quantity: 100, line_total: 200, unit_cost: 2 },
    create: {
      id: POL2,
      purchase_order_id: po.id,
      item_id: ITEM_BOLT,
      quantity: 100,
      unit_cost: 2,
      line_total: 200,
      received_quantity: 0
    }
  });

  await prisma.inventoryStock.upsert({
    where: {
      organization_id_branch_id_item_id: {
        organization_id: ORG,
        branch_id: BR_MAIN,
        item_id: ITEM_WIDGET
      }
    },
    update: {
      quantity_on_hand: 120,
      reserved_quantity: 5,
      available_quantity: 115,
      stock_valuation: new Prisma.Decimal("1500")
    },
    create: {
      id: STK_WIDGET_MAIN,
      organization_id: ORG,
      branch_id: BR_MAIN,
      item_id: ITEM_WIDGET,
      quantity_on_hand: 120,
      reserved_quantity: 5,
      available_quantity: 115,
      in_transit_quantity: 0,
      incoming_quantity: 0,
      damaged_quantity: 0,
      stock_valuation: new Prisma.Decimal("1500")
    }
  });

  await prisma.inventoryStock.upsert({
    where: {
      organization_id_branch_id_item_id: {
        organization_id: ORG,
        branch_id: BR_MAIN,
        item_id: ITEM_BOLT
      }
    },
    update: {
      quantity_on_hand: 400,
      reserved_quantity: 0,
      available_quantity: 400,
      stock_valuation: new Prisma.Decimal("800")
    },
    create: {
      id: STK_BOLT_MAIN,
      organization_id: ORG,
      branch_id: BR_MAIN,
      item_id: ITEM_BOLT,
      quantity_on_hand: 400,
      reserved_quantity: 0,
      available_quantity: 400,
      in_transit_quantity: 0,
      incoming_quantity: 0,
      damaged_quantity: 0,
      stock_valuation: new Prisma.Decimal("800")
    }
  });

  await prisma.inventoryStock.upsert({
    where: {
      organization_id_branch_id_item_id: {
        organization_id: ORG,
        branch_id: branchSecond.id,
        item_id: ITEM_WIDGET
      }
    },
    update: {
      quantity_on_hand: 15,
      reserved_quantity: 0,
      available_quantity: 15,
      stock_valuation: new Prisma.Decimal("187.5")
    },
    create: {
      id: STK_WIDGET_SECOND,
      organization_id: ORG,
      branch_id: branchSecond.id,
      item_id: ITEM_WIDGET,
      quantity_on_hand: 15,
      reserved_quantity: 0,
      available_quantity: 15,
      in_transit_quantity: 0,
      incoming_quantity: 0,
      damaged_quantity: 0,
      stock_valuation: new Prisma.Decimal("187.5")
    }
  });

  await prisma.contact.upsert({
    where: { id: CONTACT1 },
    update: { full_name: "Jordan Demo", email: "jordan@example.com" },
    create: {
      id: CONTACT1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      full_name: "Jordan Demo",
      email: "jordan@example.com",
      created_by: adminId
    }
  });

  await prisma.lead.upsert({
    where: { id: LEAD1 },
    update: { status: LeadStatus.QUALIFIED },
    create: {
      id: LEAD1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      contact_id: CONTACT1,
      status: LeadStatus.QUALIFIED,
      created_by: adminId
    }
  });

  await prisma.opportunity.upsert({
    where: { id: OPP1 },
    update: { status: OpportunityStatus.OPEN },
    create: {
      id: OPP1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      lead_id: LEAD1,
      status: OpportunityStatus.OPEN,
      created_by: adminId
    }
  });

  const grCreatedAt = new Date("2026-01-10T10:00:00.000Z");
  const grReceivedAt = new Date("2026-01-11T10:00:00.000Z");

  const gr = await prisma.goodsReceipt.upsert({
    where: {
      organization_id_receipt_number: {
        organization_id: ORG,
        receipt_number: "SEED-GR-001"
      }
    },
    update: {
      status: GoodsReceiptStatus.RECEIVED,
      supplier_id: SUP_A,
      purchase_order_id: po.id,
      receiving_location_id: LOC_BIN_MAIN,
      received_date: grReceivedAt
    },
    create: {
      id: GR1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      supplier_id: SUP_A,
      purchase_order_id: po.id,
      receiving_location_id: LOC_BIN_MAIN,
      receipt_number: "SEED-GR-001",
      status: GoodsReceiptStatus.RECEIVED,
      created_at: grCreatedAt,
      received_date: grReceivedAt,
      received_by: adminId
    }
  });

  await prisma.goodsReceiptLine.upsert({
    where: { id: GRL1 },
    update: { ordered_qty: 10, received_qty: 8, remaining_qty: 2, rejected_qty: 0 },
    create: {
      id: GRL1,
      goods_receipt_id: gr.id,
      item_id: ITEM_WIDGET,
      ordered_qty: 10,
      received_qty: 8,
      remaining_qty: 2,
      rejected_qty: 0
    }
  });

  await prisma.inventoryLot.upsert({
    where: { id: LOT1 },
    update: {
      quantity_received: 8,
      quantity_available: 8,
      status: "ACTIVE",
      goods_receipt_id: gr.id
    },
    create: {
      id: LOT1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      item_id: ITEM_WIDGET,
      supplier_id: SUP_A,
      goods_receipt_id: gr.id,
      batch_number: "SEED-BATCH-001",
      quantity_received: 8,
      quantity_available: 8,
      status: "ACTIVE"
    }
  });

  await prisma.inventoryLotBalance.upsert({
    where: { id: LOTBAL1 },
    update: {
      quantity_on_hand: 8,
      available_quantity: 8,
      location_id: LOC_BIN_MAIN
    },
    create: {
      id: LOTBAL1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      item_id: ITEM_WIDGET,
      lot_id: LOT1,
      location_id: LOC_BIN_MAIN,
      quantity_on_hand: 8,
      reserved_quantity: 0,
      available_quantity: 8,
      damaged_quantity: 0,
      in_transit_quantity: 0
    }
  });

  await prisma.inventoryMovement.upsert({
    where: { id: MOV1 },
    update: {},
    create: {
      id: MOV1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      item_id: ITEM_WIDGET,
      movement_type: DistributionMovementType.PURCHASE_RECEIPT,
      quantity: 5,
      status: "POSTED",
      reference_type: "PurchaseOrder",
      reference_id: po.id,
      performed_by: adminId
    }
  });

  await prisma.inventoryMovement.upsert({
    where: { id: MOV2 },
    update: {},
    create: {
      id: MOV2,
      organization_id: ORG,
      branch_id: BR_MAIN,
      item_id: ITEM_WIDGET,
      movement_type: DistributionMovementType.ADJUSTMENT_INCREASE,
      quantity: 2,
      status: "POSTED",
      performed_by: adminId
    }
  });

  const stCreatedAt = new Date("2026-01-12T10:00:00.000Z");
  const stDispatchedAt = new Date("2026-01-13T10:00:00.000Z");
  const stReceivedAt = new Date("2026-01-14T10:00:00.000Z");

  const st = await prisma.stockTransfer.upsert({
    where: {
      organization_id_transfer_number: {
        organization_id: ORG,
        transfer_number: "SEED-ST-001"
      }
    },
    update: {
      status: StockTransferStatus.COMPLETED,
      source_location_id: LOC_BIN_MAIN,
      destination_location_id: LOC_DOCK_SECOND,
      dispatched_date: stDispatchedAt,
      received_date: stReceivedAt
    },
    create: {
      id: ST1,
      organization_id: ORG,
      transfer_number: "SEED-ST-001",
      source_branch_id: BR_MAIN,
      destination_branch_id: branchSecond.id,
      source_location_id: LOC_BIN_MAIN,
      destination_location_id: LOC_DOCK_SECOND,
      status: StockTransferStatus.COMPLETED,
      requested_by: staff.id,
      approved_by: adminId,
      created_at: stCreatedAt,
      dispatched_date: stDispatchedAt,
      received_date: stReceivedAt
    }
  });

  await prisma.stockTransferLine.upsert({
    where: { id: STL1 },
    update: {
      quantity_requested: 3,
      quantity_sent: 3,
      quantity_received: 3
    },
    create: {
      id: STL1,
      stock_transfer_id: st.id,
      item_id: ITEM_WIDGET,
      quantity_requested: 3,
      quantity_sent: 3,
      quantity_received: 3
    }
  });

  const adjCreatedAt = new Date("2026-01-15T10:00:00.000Z");
  const adjAppliedAt = new Date("2026-01-16T10:00:00.000Z");

  const adj = await prisma.stockAdjustment.upsert({
    where: {
      organization_id_adjustment_number: {
        organization_id: ORG,
        adjustment_number: "SEED-ADJ-001"
      }
    },
    update: {
      status: StockAdjustmentStatus.APPLIED,
      applied_at: adjAppliedAt
    },
    create: {
      id: ADJ1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      adjustment_number: "SEED-ADJ-001",
      status: StockAdjustmentStatus.APPLIED,
      adjustment_type: StockAdjustmentType.INCREASE,
      reason: "Demo seed stock correction",
      approved_by: adminId,
      created_by_user: adminId,
      created_at: adjCreatedAt,
      applied_at: adjAppliedAt
    }
  });

  await prisma.stockAdjustmentLine.upsert({
    where: { id: ADJL1 },
    update: { previous_qty: 90, adjusted_qty: 100, variance: 10 },
    create: {
      id: ADJL1,
      stock_adjustment_id: adj.id,
      item_id: ITEM_BOLT,
      previous_qty: 90,
      adjusted_qty: 100,
      variance: 10
    }
  });

  const dispatch = await prisma.stockDispatch.upsert({
    where: {
      organization_id_dispatch_number: {
        organization_id: ORG,
        dispatch_number: "SEED-DSP-001"
      }
    },
    update: {
      status: DispatchStatus.DRAFT,
      dispatch_location_id: LOC_BIN_MAIN
    },
    create: {
      id: DSP1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      dispatch_location_id: LOC_BIN_MAIN,
      dispatch_number: "SEED-DSP-001",
      destination: "Demo Customer — Downtown",
      status: DispatchStatus.DRAFT
    }
  });

  await prisma.stockDispatchLine.upsert({
    where: { id: DSPL1 },
    update: { quantity: 2 },
    create: {
      id: DSPL1,
      stock_dispatch_id: dispatch.id,
      item_id: ITEM_WIDGET,
      quantity: 2
    }
  });

  const pickJob = await prisma.dispatchPickJob.upsert({
    where: {
      organization_id_pick_number: {
        organization_id: ORG,
        pick_number: "SEED-PICK-001"
      }
    },
    update: { status: "DRAFT" },
    create: {
      id: PICKJOB1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      stock_dispatch_id: dispatch.id,
      pick_number: "SEED-PICK-001",
      status: "DRAFT"
    }
  });

  await prisma.dispatchPickLine.upsert({
    where: { id: PICKLINE1 },
    update: { requested_qty: 2, picked_qty: 1 },
    create: {
      id: PICKLINE1,
      dispatch_pick_job_id: pickJob.id,
      stock_dispatch_line_id: DSPL1,
      item_id: ITEM_WIDGET,
      requested_qty: 2,
      picked_qty: 1
    }
  });

  const packJob = await prisma.dispatchPackJob.upsert({
    where: {
      organization_id_pack_number: {
        organization_id: ORG,
        pack_number: "SEED-PACK-001"
      }
    },
    update: { status: "DRAFT" },
    create: {
      id: PACKJOB1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      stock_dispatch_id: dispatch.id,
      pack_number: "SEED-PACK-001",
      status: "DRAFT"
    }
  });

  await prisma.dispatchPackLine.upsert({
    where: { id: PACKLINE1 },
    update: { packed_qty: 1 },
    create: {
      id: PACKLINE1,
      dispatch_pack_job_id: packJob.id,
      stock_dispatch_line_id: DSPL1,
      item_id: ITEM_WIDGET,
      packed_qty: 1
    }
  });

  const rtn = await prisma.stockReturn.upsert({
    where: {
      organization_id_return_number: {
        organization_id: ORG,
        return_number: "SEED-RTN-001"
      }
    },
    update: {
      status: StockReturnStatus.DRAFT,
      source_branch_id: BR_MAIN,
      destination_branch_id: BR_MAIN,
      source_location_id: LOC_BIN_MAIN,
      destination_location_id: LOC_WH_MAIN
    },
    create: {
      id: RTN1,
      organization_id: ORG,
      return_number: "SEED-RTN-001",
      return_type: StockReturnType.CUSTOMER_RETURN,
      status: StockReturnStatus.DRAFT,
      source_branch_id: BR_MAIN,
      destination_branch_id: BR_MAIN,
      source_location_id: LOC_BIN_MAIN,
      destination_location_id: LOC_WH_MAIN,
      reason: "Demo customer return"
    }
  });

  await prisma.stockReturnLine.upsert({
    where: { id: RTNL1 },
    update: { quantity: 1 },
    create: {
      id: RTNL1,
      stock_return_id: rtn.id,
      item_id: ITEM_BOLT,
      quantity: 1
    }
  });

  await prisma.inventoryReservation.upsert({
    where: { id: RES1 },
    update: {
      reserved_quantity: 5,
      status: InventoryReservationStatus.ACTIVE,
      reference_type: "StockDispatch",
      reference_id: dispatch.id
    },
    create: {
      id: RES1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      item_id: ITEM_WIDGET,
      reserved_quantity: 5,
      reference_type: "StockDispatch",
      reference_id: dispatch.id,
      reserved_by: adminId,
      status: InventoryReservationStatus.ACTIVE,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.reorderRule.upsert({
    where: {
      organization_id_branch_id_item_id: {
        organization_id: ORG,
        branch_id: BR_MAIN,
        item_id: ITEM_BOLT
      }
    },
    update: {
      minimum_stock: 50,
      reorder_level: 80,
      reorder_quantity: 200,
      lead_time_days: 5,
      preferred_supplier_id: SUP_B
    },
    create: {
      id: RR1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      item_id: ITEM_BOLT,
      preferred_supplier_id: SUP_B,
      minimum_stock: 50,
      reorder_level: 80,
      reorder_quantity: 200,
      lead_time_days: 5,
      is_active: true
    }
  });

  await prisma.stockAlert.upsert({
    where: { id: ALERT1 },
    update: {},
    create: {
      id: ALERT1,
      organization_id: ORG,
      branch_id: BR_MAIN,
      item_id: ITEM_BOLT,
      alert_type: "LOW_STOCK",
      severity: AlertSeverity.MEDIUM,
      title: "Bolt pack approaching reorder point",
      message: "Available quantity is within demo reorder thresholds.",
      status: "OPEN"
    }
  });

  await prisma.auditLog.upsert({
    where: { id: AUD1 },
    update: {},
    create: {
      id: AUD1,
      organization_id: ORG,
      user_id: adminId,
      action: "SEED_DEMO_GRAPH",
      entity_type: "system",
      entity_id: ORG,
      metadata: { version: 1, note: "Deterministic demo dataset for local and Supabase" }
    }
  });
}
