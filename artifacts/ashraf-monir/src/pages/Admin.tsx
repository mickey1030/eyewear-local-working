import { useState, useRef, useMemo, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LayoutDashboard, ShoppingBag, Package, Users, LogOut, Lock, ImageIcon,
  ChevronDown, Plus, Trash2, GripVertical, PackagePlus, Database,
  CheckSquare, Square, Loader2, PencilLine, Check, X,
  TrendingUp, Clock, Search, FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ALL_PRODUCTS } from "@/data/products";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "overview" | "orders" | "products" | "customers";
type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

interface DbProduct {
  id: number; code?: number | null; name: string; price: string;
  imageUrl: string | null; imageUrls: string[] | null;
  color: string | null; brand: string | null; variant: string | null;
}

interface OrderItem {
  id: number; orderId: number;
  productName: string; productNameAr: string | null;
  productCode: number | null; productImageUrl: string | null;
  quantity: number; price: string;
}

interface DashOrder {
  id: number; orderNumber: string;
  customerName: string; customerPhone: string;
  customerEmail: string | null; customerAddress: string;
  status: OrderStatus;
  subtotal: string; discount: string; delivery: string; total: string;
  promoCode: string | null; lensChoice: string | null; lensType: string | null;
  createdAt: string;
  items: OrderItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRANDS = ["Italy", "Sun", "China", "Children", "Clip-On"] as const;
type Brand = (typeof BRANDS)[number];

const VARIANT_OPTIONS: Record<Brand, string[]> = {
  Sun: ["Men", "Women"],
  Italy: ["Plastic", "Half-frame", "Frameless", "Metal"],
  China: ["Plastic", "Half-frame", "Frameless", "Metal"],
  Children: ["Silicon", "Plastic"],
  "Clip-On": [],
};

const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_CFG: Record<OrderStatus, { label: string; cls: string }> = {
  pending:    { label: "Pending",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed:  { label: "Confirmed",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  processing: { label: "Processing", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  shipped:    { label: "Shipped",    cls: "bg-purple-50 text-purple-700 border-purple-200" },
  delivered:  { label: "Delivered",  cls: "bg-green-50 text-green-700 border-green-200" },
  cancelled:  { label: "Cancelled",  cls: "bg-red-50 text-red-700 border-red-200" },
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const editRowSchema = z.object({
  name:  z.string().min(1, "Required"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price"),
});
type EditRowForm = z.infer<typeof editRowSchema>;

const productFormSchema = z.object({
  name:    z.string().min(1, "Name is required"),
  price:   z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price (e.g. 450)"),
  color:   z.string().optional(),
  brand:   z.enum(["Italy", "Sun", "China", "Children", "Clip-On"], { required_error: "Brand is required" }),
  variant: z.string().min(1, "Required"),
});
type ProductForm = z.infer<typeof productFormSchema>;

const loginSchema = z.object({ password: z.string().min(1, "Password is required") });
type LoginForm = z.infer<typeof loginSchema>;

// ─── API helpers ──────────────────────────────────────────────────────────────

const API = "/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${API}/upload`, { method: "POST", credentials: "include", body: fd });
  if (!res.ok) {
    let msg = "Upload failed. Please try again.";
    try { const d = await res.json() as { error?: string }; if (d?.error) msg = d.error; } catch {}
    if (res.status === 401) msg = "Session expired — please log in again.";
    throw new Error(msg);
  }
  const { url } = await res.json() as { url: string };
  return url;
}

async function uploadImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const f of files) urls.push(await uploadImage(f));
  return urls;
}

const checkAuth     = () => apiFetch<{ authenticated: boolean }>("/admin/me");
const loginApi      = (p: string) => apiFetch<{ ok: boolean }>("/admin/login", { method: "POST", body: JSON.stringify({ password: p }) });
const logoutApi     = () => apiFetch<{ ok: boolean }>("/admin/logout", { method: "POST" });
const fetchProducts = () => apiFetch<DbProduct[]>("/products");
const createProduct = (d: Omit<DbProduct, "id">) => apiFetch<DbProduct>("/products", { method: "POST", body: JSON.stringify(d) });
const updateProduct = (id: number, d: Partial<Omit<DbProduct, "id">>) => apiFetch<DbProduct>(`/products/${id}`, { method: "PUT", body: JSON.stringify(d) });
const deleteProduct = (id: number) => apiFetch<void>(`/products/${id}`, { method: "DELETE" });
const fetchOrders   = () => apiFetch<DashOrder[]>("/admin/orders");
const updateOrderStatus = (id: number, status: string) =>
  apiFetch<DashOrder>(`/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Select({ value, onChange, options, placeholder, className }: {
  value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-9 rounded-md border border-gray-300 bg-white px-3 pr-8 text-sm appearance-none text-gray-900",
          "focus:outline-none focus:ring-2 focus:ring-primary",
          !value && "text-gray-400",
        )}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, cls } = STATUS_CFG[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap", cls)}>
      {label}
    </span>
  );
}

function ImageUploadField({ value, onChange }: { value: File[]; onChange: (f: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...value];
    Array.from(list).forEach((f) => { if (!next.find((x) => x.name === f.name && x.size === f.size)) next.push(f); });
    onChange(next);
    if (ref.current) ref.current.value = "";
  };
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block">Product Images <span className="text-gray-400">(one or more)</span></label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((f, i) => (
            <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 group">
              <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute inset-0 flex items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div onClick={() => ref.current?.click()}
        className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
        <ImageIcon className="h-5 w-5 text-gray-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">Click to upload</p>
          <p className="text-xs text-gray-400">PNG, JPG, WebP · max 10 MB each</p>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(e) => add(e.target.files)} />
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const onSubmit = handleSubmit(async ({ password }) => {
    setError("");
    try { await loginApi(password); onSuccess(); }
    catch { setError("Incorrect password. Please try again."); }
  });
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-serif font-bold text-gray-900">Admin Access</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your admin password to continue</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Password</label>
            <Input {...register("password")} type="password" placeholder="••••••••" autoFocus
              className="bg-white border-gray-300 text-gray-900 focus-visible:ring-primary" />
            {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>}
          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Inline image-add button ──────────────────────────────────────────────────

function AddImageButton({ onAdd }: { onAdd: (files: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary/60 hover:text-primary transition-colors shrink-0"
        title="Add images"
      >
        <Plus className="h-4 w-4" />
        <span className="text-[9px] leading-none font-medium">Add</span>
      </button>
      <input
        ref={ref} type="file" accept="image/*,.heic,.heif" multiple className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) { onAdd(files); e.target.value = ""; }
        }}
      />
    </>
  );
}

// ─── Editable product row ─────────────────────────────────────────────────────

type EditRowSave = EditRowForm & { imageUrl: string | null; imageUrls: string[] };

function EditableRow({ product, onSave, onDelete }: {
  product: DbProduct;
  onSave: (d: EditRowSave) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Derive initial gallery from DB: prefer imageUrls array, fall back to imageUrl
  const initialUrls = (): string[] => {
    if (product.imageUrls && product.imageUrls.length > 0) return [...product.imageUrls];
    if (product.imageUrl) return [product.imageUrl];
    return [];
  };

  const [existingUrls, setExistingUrls] = useState<string[]>(initialUrls);
  const [newFiles,     setNewFiles]     = useState<File[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditRowForm>({
    resolver: zodResolver(editRowSchema),
    defaultValues: { name: product.name, price: product.price },
  });

  const cancel = () => {
    reset({ name: product.name, price: product.price });
    setExistingUrls(initialUrls());
    setNewFiles([]);
    setUploadError("");
    setEditing(false);
  };

  const save = handleSubmit(async (formData) => {
    setSaving(true);
    setUploadError("");
    try {
      let uploaded: string[] = [];
      if (newFiles.length > 0) {
        setUploading(true);
        try { uploaded = await uploadImages(newFiles); } finally { setUploading(false); }
      }
      const allUrls = [...existingUrls, ...uploaded];
      await onSave({
        ...formData,
        imageUrls: allUrls,
        imageUrl:  allUrls[0] ?? null,
      });
      setNewFiles([]);
      setEditing(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  });

  const totalImages = existingUrls.length + newFiles.length;
  const busy = saving || uploading;

  if (editing) return (
    <tr className="border-t border-gray-200 bg-gray-50/80">
      <td colSpan={6} className="px-4 py-4">
        <div className="space-y-4">

          {/* ── Text fields + action buttons ── */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Name</label>
              <Input {...register("name")} className="h-8 text-sm bg-white border-gray-300 text-gray-900" />
              {errors.name && <p className="text-red-600 text-[11px] mt-0.5">{errors.name.message}</p>}
            </div>
            <div className="w-32">
              <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Price (EGP)</label>
              <Input {...register("price")} className="h-8 text-sm bg-white border-gray-300 text-gray-900" />
              {errors.price && <p className="text-red-600 text-[11px] mt-0.5">{errors.price.message}</p>}
            </div>
            <div className="flex items-center gap-1.5 pb-0.5">
              <Button size="sm" variant="ghost" onClick={cancel} disabled={busy} className="h-8 px-2 text-xs text-gray-500 hover:text-gray-900 gap-1">
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={busy} className="h-8 px-3 text-xs gap-1.5">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {uploading ? "Uploading…" : saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>

          {/* ── Image gallery ── */}
          <div>
            <label className="text-[10px] font-medium text-gray-400 mb-2 block uppercase tracking-wide">
              Images {totalImages > 0 ? `(${totalImages})` : "— none yet"}
            </label>
            <div className="flex flex-wrap gap-2">

              {/* Existing saved images */}
              {existingUrls.map((url, i) => (
                <div key={url + i} className="relative group h-16 w-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                  <img src={url} alt="" loading="lazy" className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <button
                    type="button"
                    title="Remove image"
                    onClick={() => setExistingUrls((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {i === 0 && (
                    <div className="absolute bottom-0 inset-x-0 bg-primary/80 text-white text-[8px] font-bold text-center py-0.5 leading-none pointer-events-none">
                      COVER
                    </div>
                  )}
                </div>
              ))}

              {/* Pending new files (not yet uploaded) */}
              {newFiles.map((f, i) => (
                <div key={f.name + i} className="relative group h-16 w-16 rounded-lg overflow-hidden border border-primary/40 bg-primary/5 shrink-0">
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    title="Remove"
                    onClick={() => setNewFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-primary/75 text-white text-[8px] font-bold text-center py-0.5 leading-none pointer-events-none">
                    NEW
                  </div>
                </div>
              ))}

              {/* Add-more button */}
              <AddImageButton onAdd={(files) =>
                setNewFiles((prev) => {
                  const next = [...prev];
                  files.forEach((f) => { if (!next.find((x) => x.name === f.name && x.size === f.size)) next.push(f); });
                  return next;
                })
              } />
            </div>

            {existingUrls.length === 0 && newFiles.length === 0 && (
              <p className="text-[11px] text-gray-400 mt-1.5">No images saved — upload at least one so the product is visible in the store.</p>
            )}
            {newFiles.length > 0 && !uploading && (
              <p className="text-[11px] text-primary mt-1.5">{newFiles.length} new image{newFiles.length !== 1 ? "s" : ""} will be uploaded when you save.</p>
            )}
            {uploadError && <p className="text-red-600 text-[11px] mt-1.5">{uploadError}</p>}
          </div>

        </div>
      </td>
    </tr>
  );

  // ── Read-only row ──
  const thumbUrl = product.imageUrls?.[0] ?? product.imageUrl ?? null;
  const imgCount = product.imageUrls?.length ?? (product.imageUrl ? 1 : 0);

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 group transition-colors">
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            {thumbUrl
              ? <img src={thumbUrl} alt={product.name} className="h-9 w-9 rounded-lg object-cover bg-gray-100" loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              : <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon className="h-4 w-4 text-gray-400" /></div>}
            {imgCount > 1 && (
              <span className="absolute -bottom-1 -right-1 h-4 min-w-[16px] px-0.5 rounded-full bg-gray-700 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {imgCount}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{product.name}</p>
            {product.color && <p className="text-xs text-gray-500">{product.color}</p>}
          </div>
        </div>
      </td>
      <td className="py-3 px-3">
        {product.code != null
          ? <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">#{product.code}</span>
          : <span className="text-xs text-gray-300">—</span>}
      </td>
      <td className="py-3 px-3 text-sm text-primary font-semibold whitespace-nowrap">{product.price} EGP</td>
      <td className="py-3 px-3 text-xs text-gray-500">{product.brand ?? "—"}</td>
      <td className="py-3 px-3 text-xs text-gray-500">{product.variant ?? "—"}</td>
      <td className="py-3 px-3 text-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-7 w-7 p-0 text-gray-400 hover:text-primary" title="Edit product">
          <PencilLine className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 w-7 p-0 text-gray-400 hover:text-red-600" title="Delete product">
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

// ─── Add product form ─────────────────────────────────────────────────────────

function AddProductForm({ onCreated }: { onCreated: () => void }) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading,  setUploading]  = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { register, handleSubmit, control, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<ProductForm>({ resolver: zodResolver(productFormSchema), defaultValues: { name: "", price: "", color: "", brand: undefined, variant: "" } });
  const brand        = useWatch({ control, name: "brand" }) as Brand | undefined;
  const variantValue = useWatch({ control, name: "variant" }) ?? "";
  const variantOpts  = brand ? VARIANT_OPTIONS[brand] : [];
  const onBrandChange = (v: string) => { setValue("brand", v as Brand, { shouldValidate: true }); setValue("variant", ""); };
  const onSubmit = handleSubmit(async (data) => {
    setSubmitError("");
    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploading(true);
        try { imageUrls = await uploadImages(imageFiles); } finally { setUploading(false); }
      }
      await createProduct({ name: data.name, price: data.price, color: data.color ?? null, brand: data.brand, variant: data.variant, imageUrl: imageUrls[0] ?? null, imageUrls });
      reset(); setImageFiles([]); onCreated();
    } catch (err) { setSubmitError(err instanceof Error ? err.message : "Something went wrong."); }
  });
  const busy = isSubmitting || uploading;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Name</label>
          <Input {...register("name")} placeholder="Product name" className="bg-white border-gray-300 text-gray-900 focus-visible:ring-primary h-9 text-sm" />
          {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Price (EGP)</label>
          <Input {...register("price")} placeholder="e.g. 450" className="bg-white border-gray-300 text-gray-900 focus-visible:ring-primary h-9 text-sm" />
          {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Color</label>
          <Input {...register("color")} placeholder="e.g. Black, Tortoise, Gold" className="bg-white border-gray-300 text-gray-900 focus-visible:ring-primary h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Brand / Origin</label>
          <Select value={brand ?? ""} onChange={onBrandChange} options={[...BRANDS]} placeholder="Select brand…" />
          {errors.brand && <p className="text-red-600 text-xs mt-1">{errors.brand.message}</p>}
        </div>
      </div>
      {brand && (
        <div>
          {brand === "Clip-On" ? (
            <>
              <label className="text-xs text-gray-500 mb-1 block">Details</label>
              <Input {...register("variant")} placeholder="e.g. Grey Tint Sun, Blue Cut, Polarized Mirror…" className="bg-white border-gray-300 text-gray-900 focus-visible:ring-primary h-9 text-sm" />
            </>
          ) : (
            <>
              <label className="text-xs text-gray-500 mb-1 block">{brand === "Sun" ? "Gender" : brand === "Children" ? "Material" : "Frame Type"}</label>
              <Select value={variantValue} onChange={(v) => setValue("variant", v, { shouldValidate: true })} options={variantOpts}
                placeholder={brand === "Sun" ? "Select gender…" : brand === "Children" ? "Select material…" : "Select frame type…"} />
            </>
          )}
          {errors.variant && <p className="text-red-600 text-xs mt-1">{errors.variant.message}</p>}
        </div>
      )}
      <ImageUploadField value={imageFiles} onChange={setImageFiles} />
      {submitError && <p className="text-red-600 text-xs">{submitError}</p>}
      <Button type="submit" size="sm" disabled={busy} className="gap-2">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        {uploading ? "Uploading image…" : "Add to Database"}
      </Button>
    </form>
  );
}

// ─── Overview Section ─────────────────────────────────────────────────────────

function OverviewSection({ orders, productCount }: { orders: DashOrder[]; productCount: number }) {
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const revenue      = activeOrders.reduce((s, o) => s + Number(o.total), 0);
  const pending      = orders.filter((o) => o.status === "pending").length;
  const recent       = orders.slice(0, 10);

  const kpis = [
    { label: "Total Orders",   value: orders.length,                     icon: ShoppingBag, color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Total Revenue",  value: `${revenue.toLocaleString()} EGP`, icon: TrendingUp,  color: "text-green-600",  bg: "bg-green-50" },
    { label: "Pending Orders", value: pending,                           icon: Clock,       color: "text-amber-600",  bg: "bg-amber-50" },
    { label: "Products",       value: productCount,                      icon: Package,     color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const statusSummary = ORDER_STATUSES.map((s) => ({ status: s, count: orders.filter((o) => o.status === s).length })).filter((x) => x.count > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Ashraf Monir · Eyewear Boutique</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs text-gray-500 leading-snug">{label}</span>
              <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("h-4 w-4", color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-serif font-semibold text-gray-900">Recent Orders</h2>
            <span className="text-xs text-gray-400">{orders.length} total</span>
          </div>
          {recent.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No orders yet</p>
              <p className="text-xs mt-1 opacity-60">Orders placed from the storefront will appear here</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-start px-5 py-3 text-xs font-medium text-gray-400">Order</th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-gray-400">Customer</th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-gray-400 hidden md:table-cell">Total</th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-primary font-bold">{o.orderNumber}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 text-sm truncate max-w-[120px]">{o.customerName}</p>
                      <p className="text-xs text-gray-400">{o.customerPhone}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-primary text-sm whitespace-nowrap hidden md:table-cell">
                      {Number(o.total).toLocaleString()} EGP
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Status breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-serif font-semibold text-gray-900">Status Breakdown</h2>
          </div>
          <div className="p-4 space-y-3">
            {statusSummary.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            ) : ORDER_STATUSES.map((s) => {
              const count = orders.filter((o) => o.status === s).length;
              const pct   = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 capitalize">{STATUS_CFG[s].label}</span>
                    <span className="text-xs font-medium text-gray-700">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────

function OrdersSection({ orders, onStatusUpdate, isUpdating }: {
  orders: DashOrder[];
  onStatusUpdate: (id: number, status: string) => void;
  isUpdating: boolean;
}) {
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<OrderStatus | "all">("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "all" || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderNumber.toLowerCase().includes(q)
      || o.customerName.toLowerCase().includes(q)
      || o.customerPhone.includes(q);
    return matchStatus && matchSearch;
  });

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const s of ORDER_STATUSES) c[s] = orders.filter((o) => o.status === s).length;
    return c;
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} total · {orders.filter((o) => o.status === "pending").length} pending</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number, name, or phone…"
          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...ORDER_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as OrderStatus | "all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 bg-white"
            )}
          >
            {s === "all" ? "All" : STATUS_CFG[s as OrderStatus].label}
            {" "}
            <span className="opacity-60">({statusCounts[s]})</span>
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{orders.length === 0 ? "No orders yet" : "No orders match your filter"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-400">Order #</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-400">Customer</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-400 hidden sm:table-cell">Items</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-400">Total</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-400 hidden lg:table-cell">Date</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-400">Status</th>
                  <th className="text-end px-4 py-3 text-xs font-medium text-gray-400">Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <Fragment key={o.id}>
                    <tr
                      className={cn("border-t border-gray-50 cursor-pointer transition-colors", expanded === o.id ? "bg-gray-50" : "hover:bg-gray-50")}
                      onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{o.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{o.customerName}</p>
                        <p className="text-xs text-gray-400">{o.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">
                        {Number(o.total).toLocaleString()} EGP
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {new Date(o.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <select
                            value={o.status}
                            onChange={(e) => onStatusUpdate(o.id, e.target.value)}
                            disabled={isUpdating}
                            className="appearance-none h-7 ps-2 pe-6 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{STATUS_CFG[s].label}</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expanded === o.id && (
                      <tr className="border-t border-gray-100 bg-gray-50">
                        <td colSpan={7} className="px-4 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            <div>
                              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Customer</p>
                              <p className="font-medium text-gray-900">{o.customerName}</p>
                              <p className="text-gray-500">{o.customerPhone}</p>
                              {o.customerEmail && <p className="text-gray-500">{o.customerEmail}</p>}
                              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">{o.customerAddress}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Items Ordered</p>
                              <div className="space-y-3">
                                {o.items.length === 0
                                  ? <p className="text-gray-400 text-xs">No items recorded</p>
                                  : o.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                      {/* Thumbnail */}
                                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                                        {item.productImageUrl
                                          ? <img src={item.productImageUrl} alt={item.productName} className="h-full w-full object-cover" loading="lazy"
                                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                          : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-gray-300" /></div>}
                                      </div>
                                      {/* Info */}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          {item.productCode && (
                                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{item.productCode}</span>
                                          )}
                                          <span className="text-xs text-gray-400">×{item.quantity}</span>
                                        </div>
                                      </div>
                                      {/* Price */}
                                      <span className="font-semibold text-gray-900 shrink-0 text-sm">
                                        {(Number(item.price) * item.quantity).toLocaleString()} EGP
                                      </span>
                                    </div>
                                  ))}
                              </div>
                              {(o.lensChoice || o.lensType) && (
                                <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                                  Lens: {o.lensChoice}{o.lensType ? ` · ${o.lensType}` : ""}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Summary</p>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{Number(o.subtotal).toLocaleString()} EGP</span></div>
                                {Number(o.discount) > 0 && (
                                  <div className="flex justify-between text-green-600">
                                    <span>Discount{o.promoCode ? ` (${o.promoCode})` : ""}</span>
                                    <span>−{Number(o.discount).toLocaleString()} EGP</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-gray-500">
                                  <span>Delivery</span>
                                  <span>{Number(o.delivery) === 0 ? "Free" : `${Number(o.delivery)} EGP`}</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm text-primary pt-2 border-t border-gray-100">
                                  <span>Total</span><span>{Number(o.total).toLocaleString()} EGP</span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-3">
                                Placed {new Date(o.createdAt).toLocaleString("en-GB")}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Products Section ─────────────────────────────────────────────────────────

function ProductsSection() {
  const qc = useQueryClient();
  const [selected,      setSelected]      = useState<Set<string>>(new Set());
  const [importing,     setImporting]     = useState(false);
  const [dropActive,    setDropActive]    = useState(false);
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [filterBrand,   setFilterBrand]   = useState("");
  const [filterVariant, setFilterVariant] = useState("");
  const dragId = useRef<string | null>(null);

  const { data: dbProducts = [], isLoading } = useQuery({
    queryKey:        ["db-products"],
    queryFn:         fetchProducts,
    refetchInterval: 15_000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditRowSave }) =>
      updateProduct(id, { name: data.name, price: data.price, imageUrl: data.imageUrl, imageUrls: data.imageUrls }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["db-products"] }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["db-products"] }),
  });

  const dbNames = new Set(dbProducts.map((p) => p.name));

  // ── Search + filter (client-side) ──────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dbProducts.filter((p) => {
      const matchSearch = !q
        || p.name.toLowerCase().includes(q)
        || (p.code != null && String(p.code).includes(q));
      const matchBrand   = !filterBrand   || p.brand   === filterBrand;
      const matchVariant = !filterVariant || p.variant === filterVariant;
      return matchSearch && matchBrand && matchVariant;
    });
  }, [dbProducts, searchQuery, filterBrand, filterVariant]);

  const variantOptsForFilter: string[] = filterBrand
    ? VARIANT_OPTIONS[filterBrand as Brand] ?? []
    : [];

  const hasFilter = !!searchQuery || !!filterBrand || !!filterVariant;
  const clearFilters = () => { setSearchQuery(""); setFilterBrand(""); setFilterVariant(""); };

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () =>
    setSelected(new Set(ALL_PRODUCTS.filter((p) => !dbNames.has(p.name)).map((p) => p.id)));

  const importSelected = async () => {
    setImporting(true);
    const toImport = ALL_PRODUCTS.filter((p) => selected.has(p.id) && !dbNames.has(p.name));
    for (const p of toImport) {
      await createProduct({ name: p.name, price: String(p.price), imageUrl: p.image, imageUrls: p.images ?? [p.image], color: null, brand: null, variant: null });
    }
    await qc.invalidateQueries({ queryKey: ["db-products"] });
    setSelected(new Set());
    setImporting(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDropActive(false);
    const id = dragId.current; if (!id) return;
    const product = ALL_PRODUCTS.find((p) => p.id === id);
    if (!product || dbNames.has(product.name)) return;
    await createProduct({ name: product.name, price: String(product.price), imageUrl: product.image, imageUrls: product.images ?? [product.image], color: null, brand: null, variant: null });
    await qc.invalidateQueries({ queryKey: ["db-products"] });
    dragId.current = null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{dbProducts.length} products in database</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => {
              const a = document.createElement("a");
              a.href = "/api/admin/products/export";
              a.download = "ashraf-monir-products.xlsx";
              a.click();
            }}
          >
            <FileDown className="h-4 w-4" />
            Export Excel
          </Button>
          <Button size="sm" onClick={() => setShowAddForm((v) => !v)} className="gap-2">
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAddForm ? "Cancel" : "Add Product"}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <h3 className="font-serif font-semibold mb-4 flex items-center gap-2 text-sm text-gray-900">
            <Plus className="h-4 w-4 text-primary" /> New Product
          </h3>
          <AddProductForm onCreated={() => { qc.invalidateQueries({ queryKey: ["db-products"] }); setShowAddForm(false); }} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Catalog import */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <PackagePlus className="h-3.5 w-3.5 text-primary" /> Catalog Import
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="text-xs text-gray-400 hover:text-primary underline underline-offset-2">All</button>
              {selected.size > 0 && (
                <Button size="sm" onClick={importSelected} disabled={importing} className="h-7 px-2.5 text-xs gap-1">
                  {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  Import {selected.size}
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400">Check items to import, or drag onto the database panel.</p>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pe-1">
            {ALL_PRODUCTS.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Catalog is empty</p>
            ) : ALL_PRODUCTS.map((product) => {
              const inDb    = dbNames.has(product.name);
              const checked = selected.has(product.id);
              return (
                <div
                  key={product.id}
                  draggable={!inDb}
                  onDragStart={() => { dragId.current = product.id; }}
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all",
                    inDb    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : checked ? "border-primary/40 bg-primary/5 cursor-grab active:cursor-grabbing"
                             : "border-gray-200 bg-white hover:border-gray-300 cursor-grab active:cursor-grabbing"
                  )}
                >
                  <GripVertical className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                  <button disabled={inDb} onClick={() => !inDb && toggleSelect(product.id)} className="shrink-0">
                    {inDb    ? <CheckSquare className="h-3.5 w-3.5 text-gray-300" />
                    : checked ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
                             : <Square className="h-3.5 w-3.5 text-gray-400" />}
                  </button>
                  <img src={product.image} alt="" loading="lazy" className="h-8 w-8 rounded-lg object-cover bg-gray-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{product.category} · {product.subcategory}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-primary">{product.price}</p>
                    {inDb && <p className="text-[10px] text-green-600">In DB</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DB table */}
        <div className="xl:col-span-3 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
            onDragLeave={() => setDropActive(false)}
            onDrop={onDrop}
            className={cn(
              "rounded-xl border-2 border-dashed p-3 text-center text-xs transition-all",
              dropActive ? "border-primary bg-primary/5 text-primary scale-[1.01]" : "border-gray-200 bg-gray-50 text-gray-400"
            )}
          >
            {dropActive ? "Drop to add to database ↓" : "Drag catalog items here to add them"}
          </div>

          {/* Search + filter bar */}
          {!isLoading && dbProducts.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {/* Search input */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or code…"
                    className="w-full ps-9 pe-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
                  />
                </div>
                {/* Brand filter */}
                <div className="relative w-36">
                  <select
                    value={filterBrand}
                    onChange={(e) => { setFilterBrand(e.target.value); setFilterVariant(""); }}
                    className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 pr-7 text-sm appearance-none text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All brands</option>
                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                </div>
                {/* Variant filter — only shown when brand with variants is selected */}
                {filterBrand && variantOptsForFilter.length > 0 && (
                  <div className="relative w-36">
                    <select
                      value={filterVariant}
                      onChange={(e) => setFilterVariant(e.target.value)}
                      className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 pr-7 text-sm appearance-none text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">All types</option>
                      {variantOptsForFilter.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  </div>
                )}
                {/* Clear filters */}
                {hasFilter && (
                  <button
                    onClick={clearFilters}
                    className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors flex items-center gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
              </div>
              {/* Result count */}
              <p className="text-xs text-gray-400 ps-0.5">
                {hasFilter
                  ? <>Showing <span className="font-medium text-gray-700">{filteredProducts.length}</span> of {dbProducts.length} products</>
                  : <>{dbProducts.length} products</>}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="font-serif font-semibold text-sm text-gray-900">Database</span>
              <Badge variant="outline" className="ms-auto border-gray-200 text-gray-500 text-xs">{dbProducts.length}</Badge>
            </div>
            {isLoading ? (
              <div className="py-16 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : dbProducts.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No products yet</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No products match your search</p>
                <button onClick={clearFilters} className="mt-2 text-xs text-primary underline underline-offset-2">Clear filters</button>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100">
                    <tr>
                      <th className="text-start py-2 px-3 text-xs font-medium text-gray-400">Product</th>
                      <th className="text-start py-2 px-3 text-xs font-medium text-gray-400">Code</th>
                      <th className="text-start py-2 px-3 text-xs font-medium text-gray-400">Price</th>
                      <th className="text-start py-2 px-3 text-xs font-medium text-gray-400 hidden md:table-cell">Brand</th>
                      <th className="text-start py-2 px-3 text-xs font-medium text-gray-400 hidden md:table-cell">Type</th>
                      <th className="py-2 px-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <EditableRow
                        key={p.id}
                        product={p}
                        onSave={async (d) => { await updateMut.mutateAsync({ id: p.id, data: d }); }}
                        onDelete={() => deleteMut.mutate(p.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Customers Section ────────────────────────────────────────────────────────

function CustomersSection({ orders }: { orders: DashOrder[] }) {
  const [search, setSearch] = useState("");

  const customers = useMemo(() => {
    const map = new Map<string, {
      name: string; phone: string; email: string | null;
      address: string; orderCount: number; totalSpent: number; lastOrder: string;
    }>();
    for (const o of orders) {
      const existing = map.get(o.customerPhone);
      if (existing) {
        existing.orderCount++;
        existing.totalSpent += Number(o.total);
        if (new Date(o.createdAt) > new Date(existing.lastOrder)) existing.lastOrder = o.createdAt;
      } else {
        map.set(o.customerPhone, { name: o.customerName, phone: o.customerPhone, email: o.customerEmail, address: o.customerAddress, orderCount: 1, totalSpent: Number(o.total), lastOrder: o.createdAt });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = search
    ? customers.filter((c) => {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email?.toLowerCase().includes(q) ?? false);
      })
    : customers;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 text-sm mt-1">{customers.length} unique customer{customers.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email…"
          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{customers.length === 0 ? "No customer data yet — orders will populate this automatically" : "No customers match your search"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-start px-5 py-3 text-xs font-medium text-gray-400">Customer</th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-gray-400 hidden md:table-cell">Contact</th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-gray-400">Orders</th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-gray-400">Total Spent</th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-gray-400 hidden lg:table-cell">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.phone} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.address}</p>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <p className="text-gray-500 text-sm">{c.phone}</p>
                      {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {c.orderCount}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-primary whitespace-nowrap">{c.totalSpent.toLocaleString()} EGP</td>
                    <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">{new Date(c.lastOrder).toLocaleDateString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin component ─────────────────────────────────────────────────────

export default function Admin() {
  const qc = useQueryClient();
  const [section, setSection] = useState<Section>("overview");

  const { data: authData, isLoading: authLoading, refetch: refetchAuth } = useQuery({
    queryKey:  ["admin-auth"],
    queryFn:   checkAuth,
    retry:     false,
    staleTime: 5 * 60 * 1000,
  });

  const logoutMut = useMutation({
    mutationFn: logoutApi,
    onSuccess:  () => {
      qc.setQueryData(["admin-auth"], null);
      qc.removeQueries({ queryKey: ["db-products"] });
      qc.removeQueries({ queryKey: ["admin-orders"] });
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey:        ["admin-orders"],
    queryFn:         fetchOrders,
    enabled:         authData?.authenticated === true,
    refetchInterval: 30_000,
  });

  const { data: dbProducts = [] } = useQuery({
    queryKey:        ["db-products"],
    queryFn:         fetchProducts,
    enabled:         authData?.authenticated === true,
    refetchInterval: 60_000,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!authData?.authenticated) return <LoginScreen onSuccess={() => refetchAuth()} />;

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  const NAV: Array<{ id: Section; label: string; icon: React.ElementType; badge?: number }> = [
    { id: "overview",   label: "Overview",   icon: LayoutDashboard },
    { id: "orders",     label: "Orders",     icon: ShoppingBag, badge: pendingCount },
    { id: "products",   label: "Products",   icon: Package },
    { id: "customers",  label: "Customers",  icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col h-screen sticky top-0 z-10">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-serif font-bold text-sm">A</div>
            <div className="min-w-0">
              <p className="text-sm font-serif font-bold leading-tight truncate text-gray-900">Ashraf Monir</p>
              <p className="text-[10px] text-gray-400">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                section === id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-start">{label}</span>
              {badge != null && badge > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2.5 border-t border-gray-100">
          <button
            onClick={() => logoutMut.mutate()}
            disabled={logoutMut.isPending}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
          >
            {logoutMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {section === "overview" && (
            <OverviewSection orders={orders} productCount={dbProducts.length} />
          )}
          {section === "orders" && (
            <OrdersSection
              orders={orders}
              onStatusUpdate={(id, status) => statusMut.mutate({ id, status })}
              isUpdating={statusMut.isPending}
            />
          )}
          {section === "products" && <ProductsSection />}
          {section === "customers" && <CustomersSection orders={orders} />}
        </div>
      </main>
    </div>
  );
}
