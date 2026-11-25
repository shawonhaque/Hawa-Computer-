import { Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveProduct } from "@/actions/admin-commerce";

type ProductData = {
  id?: string;
  sku?: string;
  slug?: string;
  categoryId?: string;
  nameBn?: string;
  nameEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  price?: number;
  comparePrice?: number | null;
  stock?: number;
  lowStockAt?: number;
  brand?: string | null;
  active?: boolean;
  featured?: boolean;
};

export function ProductForm({
  product,
  categories,
  labels,
}: {
  product?: ProductData;
  categories: { id: string; nameBn: string; nameEn: string }[];
  labels: { save: string; name: string; category: string; price: string; stock: string; description: string; active: string; featured: string; brand: string; sku: string; slug: string };
}) {
  return (
    <form action={saveProduct} className="space-y-4">
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="nameBn" required>{labels.name} (বাংলা)</Label><Input id="nameBn" name="nameBn" defaultValue={product?.nameBn} required /></div>
        <div><Label htmlFor="nameEn" required>{labels.name} (English)</Label><Input id="nameEn" name="nameEn" defaultValue={product?.nameEn} required /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><Label htmlFor="sku" required>{labels.sku}</Label><Input id="sku" name="sku" defaultValue={product?.sku} required /></div>
        <div><Label htmlFor="slug" required>{labels.slug}</Label><Input id="slug" name="slug" defaultValue={product?.slug} required /></div>
        <div>
          <Label htmlFor="categoryId" required>{labels.category}</Label>
          <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} required>
            <option value="" disabled>—</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.nameEn}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div><Label htmlFor="price" required>{labels.price}</Label><Input id="price" name="price" type="number" min={1} defaultValue={product?.price ?? 0} required /></div>
        <div><Label htmlFor="comparePrice">Compare price</Label><Input id="comparePrice" name="comparePrice" type="number" min={0} defaultValue={product?.comparePrice ?? ""} /></div>
        <div><Label htmlFor="stock" required>{labels.stock}</Label><Input id="stock" name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} required /></div>
        <div><Label htmlFor="lowStockAt">Low stock at</Label><Input id="lowStockAt" name="lowStockAt" type="number" min={0} defaultValue={product?.lowStockAt ?? 5} /></div>
      </div>
      <div><Label htmlFor="brand">{labels.brand}</Label><Input id="brand" name="brand" defaultValue={product?.brand ?? ""} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="descriptionBn">{labels.description} (বাংলা)</Label><Textarea id="descriptionBn" name="descriptionBn" rows={4} defaultValue={product?.descriptionBn} /></div>
        <div><Label htmlFor="descriptionEn">{labels.description} (English)</Label><Textarea id="descriptionEn" name="descriptionEn" rows={4} defaultValue={product?.descriptionEn} /></div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="checkbox" /> {labels.active}</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} className="checkbox" /> {labels.featured}</label>
      </div>
      <SubmitButton pendingLabel="…">{labels.save}</SubmitButton>
    </form>
  );
}
