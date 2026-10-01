import { Router } from "express";
import * as XLSX from "xlsx";
import { db, productsTable } from "@workspace/db";
import { BRAND_TO_CATEGORY } from "@workspace/catalog";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.get("/admin/products/export", requireAdmin, async (req, res, next) => {
  try {
    const products = await db
      .select({
        code:    productsTable.code,
        name:    productsTable.name,
        color:   productsTable.color,
        brand:   productsTable.brand,
      })
      .from(productsTable)
      .orderBy(productsTable.code);

    const rows = products.map((p) => ({
      "Product Code": p.code ?? "",
      "Product Name": p.name,
      "Product Color": p.color ?? "",
      "Category": p.brand ? (BRAND_TO_CATEGORY[p.brand] ?? p.brand) : "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ["Product Code", "Product Name", "Product Color", "Category"],
    });

    // Column widths
    ws["!cols"] = [
      { wch: 14 }, // Product Code
      { wch: 30 }, // Product Name
      { wch: 20 }, // Product Color
      { wch: 22 }, // Category
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Products");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="ashraf-monir-products.xlsx"`);
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

export default router;
