import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, Download, Edit, Eye, Package, Trash2, Save, X, AlertCircle, CheckCircle, MinusCircle, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

// Interface para produtos da listagem (API retorna ProductList)
interface ProductListItem {
  id: number;
  name: string;
  description?: string;
  category?: string;
  ncm?: string;
  is_active: boolean;
  sku_count: number;
  total_stock: number;
  created_at: string;
}

// Interface completa para produtos (usada no modal de edição)
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  category_id?: number;
  brand: string;
  sku?: string;
  is_main_sku?: boolean;
  product_type: string; // simple, variation, composite
  ean: string;
  gtin: string;
  weight: number;
  height: number;
  width: number;
  length: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  skus: ProductSKU[];
  // Campos de Estoque
  cost_price?: number;
  sale_price?: number;
  current_stock?: number;
  location?: string;
  min_stock?: number;
  max_stock?: number;
  reserved_stock?: number;
  // Campos Fiscais
  ncm?: string;
  cest?: string;
  cfop?: string;
  icms_st?: number;
  icms?: number;
  ipi?: number;
  pis?: number;
  cofins?: number;
  iss?: number;
  iof?: number;
  cide?: number;
  csll?: number;
  irrf?: number;
  inss?: number;
  fgts?: number;
  outros_impostos?: number;
  // Campos Shopee
  shopee_category_id?: string;
  shopee_category_name?: string;
  shopee_attributes?: any;
  shopee_warranty?: string;
  shopee_brand_id?: string;
  shopee_model_id?: string;
  shopee_is_pre_order?: boolean;
  shopee_logistics?: any;
  // Campos Mercado Livre
  mercadolivre_category_id?: string;
  mercadolivre_category_name?: string;
  mercadolivre_attributes?: any;
  mercadolivre_warranty?: string;
  mercadolivre_brand_id?: string;
  mercadolivre_model_id?: string;
  mercadolivre_condition?: string;
  mercadolivre_listing_type?: string;
  mercadolivre_shipping?: any;
}

interface ProductSKU {
  id: string;
  sku_code: string;
  barcode: string;
  color: string;
  size: string;
  material: string;
  flavor: string;
  cost_price: number;
  sale_price: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reserved_stock: number;
  location: string;
  taxes: any;
  supplier_id: string;
  is_stock_sku: boolean;
  stock_sku_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: string;
  name: string;
  cnpj: string;
}

interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  sort_order: number;
  products_count: number;
  children_count: number;
  created_at: string;
}

export default function Produtos() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [mainTab, setMainTab] = useState("products");
  const [marketplaceTab, setMarketplaceTab] = useState("shopee");
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    category: "",
    category_id: undefined,
    brand: "",
    sku: "",
    is_main_sku: false,
    product_type: "simple",
    ean: "",
    gtin: "",
    weight: 0,
    height: 0,
    width: 0,
    length: 0,
    is_active: true,
    // Campos de Estoque
    cost_price: 0,
    sale_price: 0,
    current_stock: 0,
    location: "",
    min_stock: 0,
    max_stock: 0,
    reserved_stock: 0,
    // Campos Fiscais
    ncm: "",
    cest: "",
    cfop: "",
    icms_st: 0,
    icms: 0,
    ipi: 0,
    pis: 0,
    cofins: 0,
    iss: 0,
    iof: 0,
    cide: 0,
    csll: 0,
    irrf: 0,
    inss: 0,
    fgts: 0,
    outros_impostos: 0,
    // Campos Shopee
    shopee_category_id: "",
    shopee_category_name: "",
    shopee_attributes: {},
    shopee_warranty: "",
    shopee_brand_id: "",
    shopee_model_id: "",
    shopee_is_pre_order: false,
    shopee_logistics: {},
    // Campos Mercado Livre
    mercadolivre_category_id: "",
    mercadolivre_category_name: "",
    mercadolivre_attributes: {},
    mercadolivre_warranty: "",
    mercadolivre_brand_id: "",
    mercadolivre_model_id: "",
    mercadolivre_condition: "",
    mercadolivre_listing_type: "",
    mercadolivre_shipping: {}
  });

  const [skus, setSkus] = useState<ProductSKU[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    code: "",
    description: "",
    parent_id: null as number | null,
    is_active: true,
    sort_order: 0
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [skuSearchTerm, setSkuSearchTerm] = useState("");
  const [filteredSkuProducts, setFilteredSkuProducts] = useState<ProductListItem[]>([]);
  const [skuAssociations, setSkuAssociations] = useState<ProductListItem[]>([]);
  const [skuAssociationSearchTerm, setSkuAssociationSearchTerm] = useState("");
  const [filteredSkuAssociations, setFilteredSkuAssociations] = useState<ProductListItem[]>([]);
  const [newSku, setNewSku] = useState({
    sku_code: "",
    barcode: "",
    color: "",
    size: "",
    material: "",
    flavor: "",
    cost_price: 0,
    sale_price: 0,
    current_stock: 0,
    min_stock: 0,
    max_stock: 0,
    reserved_stock: 0,
    location: "",
    supplier_id: "",
    is_stock_sku: false,
    stock_sku_id: null as string | null
  });

  useEffect(() => {
    console.log("🚀 useEffect executado - carregando dados...");
    loadProducts();
    loadSuppliers();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      console.log("🔄 Iniciando carregamento de produtos...");
      setIsLoading(true);
      const response = await api.get("/api/v1/products/");
      console.log("✅ Resposta da API de produtos:", response.data);
      console.log("📊 Número de produtos recebidos:", response.data?.length || 0);
      setProducts(response.data || []);
      console.log("💾 Produtos salvos no estado");
    } catch (error) {
      console.error("❌ Erro ao carregar produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      console.log("🏁 Carregamento finalizado");
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await api.get("/api/v1/suppliers/");
      setSuppliers(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get("/api/v1/categories/");
      setCategories(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  // Funções para gerenciar categorias
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: "",
      code: "",
      description: "",
      parent_id: null,
      is_active: true,
      sort_order: 0
    });
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      code: category.code,
      description: category.description || "",
      parent_id: category.parent_id || null,
      is_active: category.is_active,
      sort_order: category.sort_order
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await api.put(`/api/v1/categories/${editingCategory.id}`, categoryFormData);
        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso",
        });
      } else {
        await api.post("/api/v1/categories/", categoryFormData);
        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso",
        });
      }
      
      setIsCategoryModalOpen(false);
      loadCategories();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a categoria",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await api.delete(`/api/v1/categories/${categoryToDelete.id}`);
      toast({
        title: "Sucesso",
        description: "Categoria deletada com sucesso",
      });
      loadCategories();
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar a categoria",
        variant: "destructive"
      });
    } finally {
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

    const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsViewMode(false);
    setFormData({
      name: "",
      description: "",
      category: "",
      category_id: undefined,
      brand: "",
      sku: "",
      is_main_sku: false,
      product_type: "simple",
      ncm: "",
      ean: "",
      gtin: "",
      weight: 0,
      height: 0,
      width: 0,
      length: 0,
      is_active: true,
      // Campos Shopee
      shopee_category_id: "",
      shopee_category_name: "",
      shopee_attributes: {},
      shopee_warranty: "",
      shopee_brand_id: "",
      shopee_model_id: "",
      shopee_is_pre_order: false,
      shopee_logistics: {},
      // Campos Mercado Livre
      mercadolivre_category_id: "",
      mercadolivre_category_name: "",
      mercadolivre_attributes: {},
      mercadolivre_warranty: "",
      mercadolivre_brand_id: "",
      mercadolivre_model_id: "",
      mercadolivre_condition: "",
      mercadolivre_listing_type: "",
      mercadolivre_shipping: {}
    });
    setSkus([]);
    setNewSku({
      sku_code: "",
      barcode: "",
      color: "",
      size: "",
      material: "",
      flavor: "",
      cost_price: 0,
      sale_price: 0,
      current_stock: 0,
      min_stock: 0,
      max_stock: 0,
      reserved_stock: 0,
      location: "",
      supplier_id: "",
      is_stock_sku: false,
      stock_sku_id: null
    });
    setIsModalOpen(true);
  };

  const handleViewProduct = async (product: ProductListItem) => {
    try {
      setIsLoading(true);
      
      // Buscar dados completos do produto
      const response = await api.get(`/api/v1/products/${product.id}`);
      const fullProduct = response.data;
      
      // Preencher o formulário com os dados do produto (somente leitura)
      setFormData({
        name: fullProduct.name || "",
        description: fullProduct.description || "",
        category: fullProduct.category || "",
        category_id: fullProduct.category_id,
        brand: fullProduct.brand || "",
        sku: fullProduct.sku || "",
        is_main_sku: fullProduct.is_main_sku || false,
        product_type: fullProduct.product_type || "simple",
        ean: fullProduct.ean || "",
        gtin: fullProduct.gtin || "",
        weight: fullProduct.weight || 0,
        height: fullProduct.height || 0,
        width: fullProduct.width || 0,
        length: fullProduct.length || 0,
        is_active: fullProduct.is_active ?? true,
        // Campos de Estoque
        cost_price: fullProduct.cost_price || 0,
        sale_price: fullProduct.sale_price || 0,
        current_stock: fullProduct.current_stock || 0,
        location: fullProduct.location || "",
        min_stock: fullProduct.min_stock || 0,
        max_stock: fullProduct.max_stock || 0,
        reserved_stock: fullProduct.reserved_stock || 0,
        // Campos Fiscais
        ncm: fullProduct.ncm || "",
        cest: fullProduct.cest || "",
        cfop: fullProduct.cfop || "",
        icms_st: fullProduct.icms_st || 0,
        icms: fullProduct.icms || 0,
        ipi: fullProduct.ipi || 0,
        pis: fullProduct.pis || 0,
        cofins: fullProduct.cofins || 0,
        iss: fullProduct.iss || 0,
        iof: fullProduct.iof || 0,
        cide: fullProduct.cide || 0,
        csll: fullProduct.csll || 0,
        irrf: fullProduct.irrf || 0,
        inss: fullProduct.inss || 0,
        fgts: fullProduct.fgts || 0,
        outros_impostos: fullProduct.outros_impostos || 0,
        // Campos Shopee
        shopee_category_id: fullProduct.shopee_category_id || "",
        shopee_category_name: fullProduct.shopee_category_name || "",
        shopee_attributes: fullProduct.shopee_attributes || {},
        shopee_warranty: fullProduct.shopee_warranty || "",
        shopee_brand_id: fullProduct.shopee_brand_id || "",
        shopee_model_id: fullProduct.shopee_model_id || "",
        shopee_is_pre_order: fullProduct.shopee_is_pre_order || false,
        shopee_logistics: fullProduct.shopee_logistics || {},
        // Campos Mercado Livre
        mercadolivre_category_id: fullProduct.mercadolivre_category_id || "",
        mercadolivre_category_name: fullProduct.mercadolivre_category_name || "",
        mercadolivre_attributes: fullProduct.mercadolivre_attributes || {},
        mercadolivre_warranty: fullProduct.mercadolivre_warranty || "",
        mercadolivre_brand_id: fullProduct.mercadolivre_brand_id || "",
        mercadolivre_model_id: fullProduct.mercadolivre_model_id || "",
        mercadolivre_condition: fullProduct.mercadolivre_condition || "",
        mercadolivre_listing_type: fullProduct.mercadolivre_listing_type || "",
        mercadolivre_shipping: fullProduct.mercadolivre_shipping || {}
      });
      
      // Carregar SKUs do produto
      setSkus(fullProduct.skus || []);
      
      // Definir como produto em visualização (não edição)
      setEditingProduct(null);
      setIsViewMode(true);
      setActiveTab("basic");
      setIsModalOpen(true);
      
    } catch (error) {
      console.error("Erro ao carregar produto para visualização:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do produto",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async (product: ProductListItem) => {
    try {
      setIsLoading(true);
      
      // Buscar dados completos do produto
      const response = await api.get(`/api/v1/products/${product.id}`);
      const fullProduct = response.data;
      
      // Preencher o formulário com os dados do produto
      setFormData({
        name: fullProduct.name || "",
        description: fullProduct.description || "",
        category: fullProduct.category || "",
        category_id: fullProduct.category_id,
        brand: fullProduct.brand || "",
        sku: fullProduct.sku || "",
        is_main_sku: fullProduct.is_main_sku || false,
        product_type: fullProduct.product_type || "simple",
        ean: fullProduct.ean || "",
        gtin: fullProduct.gtin || "",
        weight: fullProduct.weight || 0,
        height: fullProduct.height || 0,
        width: fullProduct.width || 0,
        length: fullProduct.length || 0,
        is_active: fullProduct.is_active ?? true,
        // Campos de Estoque
        cost_price: fullProduct.cost_price || 0,
        sale_price: fullProduct.sale_price || 0,
        current_stock: fullProduct.current_stock || 0,
        location: fullProduct.location || "",
        min_stock: fullProduct.min_stock || 0,
        max_stock: fullProduct.max_stock || 0,
        reserved_stock: fullProduct.reserved_stock || 0,
        // Campos Fiscais
        ncm: fullProduct.ncm || "",
        cest: fullProduct.cest || "",
        cfop: fullProduct.cfop || "",
        icms_st: fullProduct.icms_st || 0,
        icms: fullProduct.icms || 0,
        ipi: fullProduct.ipi || 0,
        pis: fullProduct.pis || 0,
        cofins: fullProduct.cofins || 0,
        iss: fullProduct.iss || 0,
        iof: fullProduct.iof || 0,
        cide: fullProduct.cide || 0,
        csll: fullProduct.csll || 0,
        irrf: fullProduct.irrf || 0,
        inss: fullProduct.inss || 0,
        fgts: fullProduct.fgts || 0,
        outros_impostos: fullProduct.outros_impostos || 0,
        // Campos Shopee
        shopee_category_id: fullProduct.shopee_category_id || "",
        shopee_category_name: fullProduct.shopee_category_name || "",
        shopee_attributes: fullProduct.shopee_attributes || {},
        shopee_warranty: fullProduct.shopee_warranty || "",
        shopee_brand_id: fullProduct.shopee_brand_id || "",
        shopee_model_id: fullProduct.shopee_model_id || "",
        shopee_is_pre_order: fullProduct.shopee_is_pre_order || false,
        shopee_logistics: fullProduct.shopee_logistics || {},
        // Campos Mercado Livre
        mercadolivre_category_id: fullProduct.mercadolivre_category_id || "",
        mercadolivre_category_name: fullProduct.mercadolivre_category_name || "",
        mercadolivre_attributes: fullProduct.mercadolivre_attributes || {},
        mercadolivre_warranty: fullProduct.mercadolivre_warranty || "",
        mercadolivre_brand_id: fullProduct.mercadolivre_brand_id || "",
        mercadolivre_model_id: fullProduct.mercadolivre_model_id || "",
        mercadolivre_condition: fullProduct.mercadolivre_condition || "",
        mercadolivre_listing_type: fullProduct.mercadolivre_listing_type || "",
        mercadolivre_shipping: fullProduct.mercadolivre_shipping || {}
      });
      
      // Carregar SKUs do produto
      setSkus(fullProduct.skus || []);
      
      // Definir como produto em edição
      setEditingProduct(fullProduct);
      setIsViewMode(false);
      setActiveTab("basic");
      setIsModalOpen(true);
      
    } catch (error) {
      console.error("Erro ao carregar produto para edição:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do produto",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    try {
      setIsLoading(true);
      
      // Validação dos campos obrigatórios
      if (!formData.name || formData.name.trim() === "") {
        toast({
          title: "Erro",
          description: "Nome do produto é obrigatório",
          variant: "destructive"
        });
        return;
      }
      
      // Log dos dados sendo enviados
      console.log("Dados sendo enviados:", formData);
      
      if (editingProduct) {
        // Update existing product
        await api.put(`/api/v1/products/${editingProduct.id}`, formData);
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso",
        });
      } else {
        // Create new product
        const response = await api.post("/api/v1/products/", formData);
        const newProduct = response.data;
        
        // Create SKUs for the new product
        for (const sku of skus) {
          await api.post(`/api/v1/products/${newProduct.id}/skus`, sku);
        }
        
        toast({
          title: "Sucesso",
          description: "Produto criado com sucesso",
        });
      }
      
      setIsModalOpen(false);
      loadProducts();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      console.error("Detalhes do erro:", error.response?.data);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Não foi possível salvar o produto",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSku = () => {
    if (!newSku.sku_code.trim()) {
      toast({
        title: "Erro",
        description: "Código SKU é obrigatório",
        variant: "destructive"
      });
      return;
    }

    const newSkuWithId: ProductSKU = {
      ...newSku,
      id: Date.now().toString(),
      taxes: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setSkus([...skus, newSkuWithId]);
    setNewSku({
      sku_code: "",
      barcode: "",
      color: "",
      size: "",
      material: "",
      flavor: "",
      cost_price: 0,
      sale_price: 0,
      current_stock: 0,
      min_stock: 0,
      max_stock: 0,
      reserved_stock: 0,
      location: "",
      supplier_id: "",
      is_stock_sku: false,
      stock_sku_id: null
    });
  };

  const removeSku = (index: number) => {
    setSkus(skus.filter((_, i) => i !== index));
  };

  const getStockStatus = (sku: ProductSKU) => {
    const availableStock = sku.current_stock - sku.reserved_stock;
    if (availableStock <= sku.min_stock) return "low";
    if (availableStock >= sku.max_stock * 0.8) return "high";
    return "normal";
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case "low":
        return <MinusCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  // Funções para gerar códigos
  const generateEAN = () => {
    // Gera um EAN-13 válido (12 dígitos + dígito verificador)
    let ean = '';
    for (let i = 0; i < 12; i++) {
      ean += Math.floor(Math.random() * 10);
    }
    
    // Calcula o dígito verificador
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(ean[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    setFormData({...formData, ean: ean + checkDigit});
  };

  const generateGTIN = () => {
    // Gera um GTIN-14 válido (13 dígitos + dígito verificador)
    let gtin = '';
    for (let i = 0; i < 13; i++) {
      gtin += Math.floor(Math.random() * 10);
    }
    
    // Calcula o dígito verificador
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(gtin[i]) * (i % 2 === 0 ? 3 : 1);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    setFormData({...formData, gtin: gtin + checkDigit});
  };

  const generateSKU = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Atenção",
        description: "Digite o nome do produto primeiro",
        variant: "destructive"
      });
      return;
    }
    
    // Gera SKU baseado no nome do produto
    let sku = formData.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Remove caracteres especiais
      .substring(0, 8); // Limita a 8 caracteres
    
    // Adiciona sufixo numérico se necessário
    if (sku.length < 3) {
      sku = sku + 'PROD';
    }
    
    // Adiciona timestamp para garantir unicidade
    const timestamp = Date.now().toString().slice(-4);
    sku = sku + timestamp;
    
    setFormData({...formData, sku: sku});
  };

  // Função para filtrar produtos com SKU principal
  const filterMainSkuProducts = (searchTerm: string) => {
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSkuProducts(filtered);
  };

  // Funções para gerenciar associações de SKUs
  const filterSkuAssociations = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredSkuAssociations([]);
      return;
    }
    
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !skuAssociations.some(assoc => assoc.id === product.id)
    );
    setFilteredSkuAssociations(filtered);
  };

  const addSkuAssociation = (product: ProductListItem) => {
    if (!skuAssociations.some(assoc => assoc.id === product.id)) {
      setSkuAssociations([...skuAssociations, product]);
      setSkuAssociationSearchTerm("");
      setFilteredSkuAssociations([]);
    }
  };

  const removeSkuAssociation = (productId: number) => {
    setSkuAssociations(skuAssociations.filter(assoc => assoc.id !== productId));
  };

  const handleDeleteProduct = async (product: ProductListItem) => {
    if (product.sku_count > 0) {
      toast({
        title: "Não é possível remover",
        description: "Este produto possui SKUs associados e não pode ser removido.",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.delete(`/api/v1/products/${product.id}`);
      toast({
        title: "Produto removido",
        description: "O produto foi removido com sucesso.",
      });
      loadProducts(); // Recarrega a lista
    } catch (error) {
      console.error("Erro ao remover produto:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o produto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Produtos</h1>
          <p className="text-muted-foreground">Catálogo de produtos e categorias</p>
        </div>
      </div>

      {/* Abas Principais */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        {/* Aba de Produtos */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Produtos</h2>
          <p className="text-muted-foreground">Gestão completa do catálogo de produtos</p>
        </div>
            <Button onClick={handleCreateProduct} className="bg-gradient-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Produtos cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {products.filter(p => p.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Ativos no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {products.reduce((total, p) => total + p.sku_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Variações cadastradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {products.filter(p => p.total_stock <= 10).length}
            </div>
            <p className="text-xs text-muted-foreground">Requer atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Produtos</CardTitle>
          <CardDescription>Lista de todos os produtos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>SKUs</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.sku_count} SKUs
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.total_stock > 0 ? "default" : "secondary"}>
                        {product.total_stock} unidades
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.is_active ? (
                        <Badge variant="default">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {product.sku_count === 0 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Aba de Categorias */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Categorias</h2>
              <p className="text-muted-foreground">Organize seus produtos em categorias</p>
            </div>
            <Button onClick={handleCreateCategory} className="bg-gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </div>

          {/* Cards de Resumo - Categorias */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">Categorias cadastradas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {categories.filter(c => c.is_active).length}
                </div>
                <p className="text-xs text-muted-foreground">Ativas no sistema</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorias Raiz</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {categories.filter(c => !c.parent_id).length}
                </div>
                <p className="text-xs text-muted-foreground">Categorias principais</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subcategorias</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {categories.filter(c => c.parent_id).length}
                </div>
                <p className="text-xs text-muted-foreground">Categorias filhas</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Categorias</CardTitle>
              <CardDescription>Lista de todas as categorias cadastradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input
                    placeholder="Buscar categorias..."
                    className="max-w-sm"
                  />
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="inactive">Inativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Produtos</TableHead>
                        <TableHead>Subcategorias</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.code}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {category.description || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{category.products_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{category.children_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.is_active ? "default" : "secondary"}>
                              {category.is_active ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                Editar
                              </Button>
                                                              <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteCategory(category)}
                                >
                                  Remover
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Cadastro/Edição */}
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? "Visualizar Produto" : editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {isViewMode ? "Visualize as informações do produto" : editingProduct ? "Edite as informações do produto" : "Cadastre um novo produto no sistema"}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="basic">Básicas</TabsTrigger>
              <TabsTrigger value="dimensions">Dimensões</TabsTrigger>
              <TabsTrigger value="fiscal">Fiscais</TabsTrigger>
              <TabsTrigger value="skus">Estoque</TabsTrigger>
              <TabsTrigger value="components" disabled={formData.product_type !== "composite"}>Composição</TabsTrigger>
              <TabsTrigger value="sku-associations" disabled={!formData.is_main_sku}>SKUs</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Informações Básicas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Nome do produto"
                      disabled={isViewMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      placeholder="Marca do produto"
                      disabled={isViewMode}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU do Produto</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      placeholder="Código SKU do produto"
                      disabled={isViewMode}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={generateSKU}
                      className="whitespace-nowrap"
                      disabled={isViewMode}
                    >
                      Gerar SKU
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição detalhada do produto"
                    rows={3}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              {/* Classificação */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Classificação</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={formData.category_id?.toString() || ""} 
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        category_id: value ? parseInt(value) : undefined,
                        category: categories.find(c => c.id.toString() === value)?.name || ""
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sem categoria</SelectItem>
                        {categories
                          .filter(cat => cat.is_active)
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product_type">Tipo de Produto</Label>
                    <Select value={formData.product_type} onValueChange={(value) => setFormData({...formData, product_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Produto Simples</SelectItem>
                        <SelectItem value="variation">Produto com Variações</SelectItem>
                        <SelectItem value="composite">Produto Composto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Códigos */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Códigos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ean">EAN</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="ean"
                        value={formData.ean}
                        onChange={(e) => setFormData({...formData, ean: e.target.value})}
                        placeholder="Código EAN"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={generateEAN}
                        className="whitespace-nowrap"
                      >
                        Gerar
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gtin">GTIN</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="gtin"
                        value={formData.gtin}
                        onChange={(e) => setFormData({...formData, gtin: e.target.value})}
                        placeholder="Código GTIN"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={generateGTIN}
                        className="whitespace-nowrap"
                      >
                        Gerar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                    <Label htmlFor="is_active">Produto Ativo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_main_sku"
                      checked={formData.is_main_sku}
                      onCheckedChange={(checked) => {
                        setFormData({...formData, is_main_sku: checked});
                        // Se desativar SKU Principal e estiver na aba SKUs, mudar para aba Básicas
                        if (!checked && activeTab === "sku-associations") {
                          setActiveTab("basic");
                        }
                      }}
                    />
                    <Label htmlFor="is_main_sku">SKU Principal de Estoque</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skus" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Controle de Estoque</h3>
              </div>

              {/* Preços e Estoque */}
              <div>
                <h4 className="text-md font-medium mb-4">Preços e Estoque</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost_price">Preço de Custo</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={formData.cost_price || ''}
                      onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sale_price">Preço de Venda</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.01"
                      value={formData.sale_price || ''}
                      onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="current_stock">Estoque Atual</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      value={formData.current_stock || ''}
                      onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Localização</Label>
                    <Input
                      id="location"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Localização no estoque"
                    />
                  </div>
                </div>
              </div>

              {/* Controle de Estoque */}
              <div>
                <h4 className="text-md font-medium mb-4">Controle de Estoque</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="min_stock">Estoque Mínimo</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      value={formData.min_stock || ''}
                      onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_stock">Estoque Máximo</Label>
                    <Input
                      id="max_stock"
                      type="number"
                      value={formData.max_stock || ''}
                      onChange={(e) => setFormData({ ...formData, max_stock: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reserved_stock">Estoque Reservado</Label>
                    <Input
                      id="reserved_stock"
                      type="number"
                      value={formData.reserved_stock || ''}
                      onChange={(e) => setFormData({ ...formData, reserved_stock: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sku-associations" className="space-y-6">
              {!formData.is_main_sku ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aba Desabilitada</h3>
                  <p className="text-muted-foreground">
                    Para associar SKUs de outros produtos, este produto deve ser marcado como "SKU Principal de Estoque" na aba Básicas.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Associar SKUs de Outros Produtos</h3>
                  </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium mb-4">Pesquisar Produtos para Associar</h4>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Digite o nome ou SKU do produto..."
                      value={skuAssociationSearchTerm}
                      onChange={(e) => {
                        setSkuAssociationSearchTerm(e.target.value);
                        filterSkuAssociations(e.target.value);
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSkuAssociationSearchTerm("");
                        setFilteredSkuAssociations([]);
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>

                {/* Lista de produtos encontrados */}
                {filteredSkuAssociations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Produtos Encontrados</h4>
                    <div className="space-y-2">
                      {filteredSkuAssociations.map((product) => (
                        <Card key={product.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    SKUs: {product.sku_count} | Categoria: {product.category || 'N/A'}
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <div>Estoque: {product.total_stock} unidades</div>
                                  <div>Status: {product.is_active ? 'Ativo' : 'Inativo'}</div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addSkuAssociation(product)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Associar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de produtos associados */}
                {skuAssociations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-md font-medium">Produtos Associados</h4>
                    <div className="space-y-2">
                      {skuAssociations.map((product) => (
                        <Card key={product.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    SKUs: {product.sku_count} | Categoria: {product.category || 'N/A'}
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <div>Estoque: {product.total_stock} unidades</div>
                                  <div>Status: {product.is_active ? 'Ativo' : 'Inativo'}</div>
                                </div>
                                <Badge variant="outline">Associado</Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeSkuAssociation(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {skuAssociations.length === 0 && filteredSkuAssociations.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum produto associado. Use a pesquisa acima para encontrar produtos que não são SKU principal de estoque.
                    </p>
                  </div>
                )}
              </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="fiscal" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Dados Fiscais</h3>
              </div>

              {/* Códigos Fiscais */}
              <div>
                <h4 className="text-md font-medium mb-4">Códigos Fiscais</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ncm">NCM</Label>
                    <Input
                      id="ncm"
                      value={formData.ncm || ''}
                      onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                      placeholder="Código NCM"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cest">CEST</Label>
                    <Input
                      id="cest"
                      value={formData.cest || ''}
                      onChange={(e) => setFormData({ ...formData, cest: e.target.value })}
                      placeholder="Código CEST"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cfop">CFOP</Label>
                    <Input
                      id="cfop"
                      value={formData.cfop || ''}
                      onChange={(e) => setFormData({ ...formData, cfop: e.target.value })}
                      placeholder="Código CFOP"
                    />
                  </div>
                </div>
              </div>

              {/* Impostos Federais */}
              <div>
                <h4 className="text-md font-medium mb-4">Impostos Federais</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="icms">ICMS (%)</Label>
                    <Input
                      id="icms"
                      type="number"
                      step="0.01"
                      value={formData.icms || ''}
                      onChange={(e) => setFormData({ ...formData, icms: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="icms_st">ICMS ST (%)</Label>
                    <Input
                      id="icms_st"
                      type="number"
                      step="0.01"
                      value={formData.icms_st || ''}
                      onChange={(e) => setFormData({ ...formData, icms_st: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ipi">IPI (%)</Label>
                    <Input
                      id="ipi"
                      type="number"
                      step="0.01"
                      value={formData.ipi || ''}
                      onChange={(e) => setFormData({ ...formData, ipi: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pis">PIS (%)</Label>
                    <Input
                      id="pis"
                      type="number"
                      step="0.01"
                      value={formData.pis || ''}
                      onChange={(e) => setFormData({ ...formData, pis: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cofins">COFINS (%)</Label>
                    <Input
                      id="cofins"
                      type="number"
                      step="0.01"
                      value={formData.cofins || ''}
                      onChange={(e) => setFormData({ ...formData, cofins: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="iof">IOF (%)</Label>
                    <Input
                      id="iof"
                      type="number"
                      step="0.01"
                      value={formData.iof || ''}
                      onChange={(e) => setFormData({ ...formData, iof: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cide">CIDE (%)</Label>
                    <Input
                      id="cide"
                      type="number"
                      step="0.01"
                      value={formData.cide || ''}
                      onChange={(e) => setFormData({ ...formData, cide: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="csll">CSLL (%)</Label>
                    <Input
                      id="csll"
                      type="number"
                      step="0.01"
                      value={formData.csll || ''}
                      onChange={(e) => setFormData({ ...formData, csll: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Impostos Trabalhistas e Outros */}
              <div>
                <h4 className="text-md font-medium mb-4">Impostos Trabalhistas e Outros</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="irrf">IRRF (%)</Label>
                    <Input
                      id="irrf"
                      type="number"
                      step="0.01"
                      value={formData.irrf || ''}
                      onChange={(e) => setFormData({ ...formData, irrf: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inss">INSS (%)</Label>
                    <Input
                      id="inss"
                      type="number"
                      step="0.01"
                      value={formData.inss || ''}
                      onChange={(e) => setFormData({ ...formData, inss: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fgts">FGTS (%)</Label>
                    <Input
                      id="fgts"
                      type="number"
                      step="0.01"
                      value={formData.fgts || ''}
                      onChange={(e) => setFormData({ ...formData, fgts: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="iss">ISS (%)</Label>
                    <Input
                      id="iss"
                      type="number"
                      step="0.01"
                      value={formData.iss || ''}
                      onChange={(e) => setFormData({ ...formData, iss: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Outros Impostos */}
              <div>
                <h4 className="text-md font-medium mb-4">Outros Impostos</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="outros_impostos">Outros Impostos (%)</Label>
                    <Input
                      id="outros_impostos"
                      type="number"
                      step="0.01"
                      value={formData.outros_impostos || ''}
                      onChange={(e) => setFormData({ ...formData, outros_impostos: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Composição do Produto</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione os produtos de estoque que compõem este produto composto
                </p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="component_sku">SKU de Estoque</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o SKU de estoque" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Selecione um produto</SelectItem>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {product.sku_count} SKUs ({product.total_stock} un)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="component_quantity">Quantidade Utilizada</Label>
                      <Input
                        id="component_quantity"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="1.0"
                      />
                    </div>
                  </div>
                   
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="component_assembly_order">Ordem de Montagem</Label>
                      <Input
                        id="component_assembly_order"
                        type="number"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="component_additional_cost">Custo Adicional</Label>
                      <Input
                        id="component_additional_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                   
                  <div className="space-y-2">
                    <Label htmlFor="component_instructions">Instruções de Montagem</Label>
                    <Textarea
                      id="component_instructions"
                      placeholder="Instruções específicas para este componente..."
                      rows={3}
                    />
                  </div>
                   
                  <div className="flex items-center space-x-2">
                    <Switch id="component_required" defaultChecked />
                    <Label htmlFor="component_required">Componente Obrigatório</Label>
                  </div>
                   
                  <Button type="button" onClick={() => {}}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar à Composição
                  </Button>
                </div>
                
                {components.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Componentes da Composição</h4>
                    <div className="space-y-2">
                      {components.map((component, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{component.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              SKU: {component.sku_code} | Quantidade: {component.quantity} un | 
                              Estoque Disponível: {component.current_stock} un | 
                              Ordem: {component.assembly_order}
                            </p>
                            {component.instructions && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {component.instructions}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={component.is_required ? "default" : "secondary"}>
                              {component.is_required ? "Obrigatório" : "Opcional"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {}}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="dimensions" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Largura (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.01"
                    value={formData.width}
                    onChange={(e) => setFormData({...formData, width: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">Comprimento (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.01"
                    value={formData.length}
                    onChange={(e) => setFormData({...formData, length: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </TabsContent>



            <TabsContent value="marketplace" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Configurações de Marketplace</h3>
              </div>

              <Tabs value={marketplaceTab} onValueChange={setMarketplaceTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="shopee">Shopee</TabsTrigger>
                  <TabsTrigger value="mercadolivre">Mercado Livre</TabsTrigger>
                </TabsList>

                <TabsContent value="shopee" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Configurações Shopee</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure as informações específicas para publicação no Shopee
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shopee_category_id">ID da Categoria Shopee</Label>
                        <Input
                          id="shopee_category_id"
                          value={formData.shopee_category_id}
                          onChange={(e) => setFormData({...formData, shopee_category_id: e.target.value})}
                          placeholder="Ex: 100001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shopee_category_name">Nome da Categoria Shopee</Label>
                        <Input
                          id="shopee_category_name"
                          value={formData.shopee_category_name}
                          onChange={(e) => setFormData({...formData, shopee_category_name: e.target.value})}
                          placeholder="Ex: Eletrônicos"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shopee_brand_id">ID da Marca Shopee</Label>
                        <Input
                          id="shopee_brand_id"
                          value={formData.shopee_brand_id}
                          onChange={(e) => setFormData({...formData, shopee_brand_id: e.target.value})}
                          placeholder="Ex: 1001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shopee_model_id">ID do Modelo Shopee</Label>
                        <Input
                          id="shopee_model_id"
                          value={formData.shopee_model_id}
                          onChange={(e) => setFormData({...formData, shopee_model_id: e.target.value})}
                          placeholder="Ex: 2001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shopee_warranty">Garantia</Label>
                        <Input
                          id="shopee_warranty"
                          value={formData.shopee_warranty}
                          onChange={(e) => setFormData({...formData, shopee_warranty: e.target.value})}
                          placeholder="Ex: 12 meses"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shopee_logistics">Configurações de Logística</Label>
                        <Textarea
                          id="shopee_logistics"
                          value={JSON.stringify(formData.shopee_logistics, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setFormData({...formData, shopee_logistics: parsed});
                            } catch (error) {
                              // Ignora erros de JSON inválido
                            }
                          }}
                          placeholder='{"weight": 0.5, "length": 20, "width": 15, "height": 10}'
                          rows={4}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="shopee_is_pre_order"
                        checked={formData.shopee_is_pre_order}
                        onCheckedChange={(checked) => setFormData({...formData, shopee_is_pre_order: checked})}
                      />
                      <Label htmlFor="shopee_is_pre_order">Produto em Pré-venda</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="shopee_attributes">Atributos Específicos (JSON)</Label>
                      <Textarea
                        id="shopee_attributes"
                        value={JSON.stringify(formData.shopee_attributes, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setFormData({...formData, shopee_attributes: parsed});
                          } catch (error) {
                            // Ignora erros de JSON inválido
                          }
                        }}
                        placeholder='{"color": "Azul", "size": "M", "material": "Algodão"}'
                        rows={6}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mercadolivre" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Configurações Mercado Livre</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure as informações específicas para publicação no Mercado Livre
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mercadolivre_category_id">ID da Categoria ML</Label>
                        <Input
                          id="mercadolivre_category_id"
                          value={formData.mercadolivre_category_id}
                          onChange={(e) => setFormData({...formData, mercadolivre_category_id: e.target.value})}
                          placeholder="Ex: MLB123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mercadolivre_category_name">Nome da Categoria ML</Label>
                        <Input
                          id="mercadolivre_category_name"
                          value={formData.mercadolivre_category_name}
                          onChange={(e) => setFormData({...formData, mercadolivre_category_name: e.target.value})}
                          placeholder="Ex: Eletrônicos"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mercadolivre_brand_id">ID da Marca ML</Label>
                        <Input
                          id="mercadolivre_brand_id"
                          value={formData.mercadolivre_brand_id}
                          onChange={(e) => setFormData({...formData, mercadolivre_brand_id: e.target.value})}
                          placeholder="Ex: 123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mercadolivre_model_id">ID do Modelo ML</Label>
                        <Input
                          id="mercadolivre_model_id"
                          value={formData.mercadolivre_model_id}
                          onChange={(e) => setFormData({...formData, mercadolivre_model_id: e.target.value})}
                          placeholder="Ex: 456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mercadolivre_warranty">Garantia</Label>
                        <Input
                          id="mercadolivre_warranty"
                          value={formData.mercadolivre_warranty}
                          onChange={(e) => setFormData({...formData, mercadolivre_warranty: e.target.value})}
                          placeholder="Ex: 12 meses"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mercadolivre_condition">Condição</Label>
                        <Select value={formData.mercadolivre_condition} onValueChange={(value) => setFormData({...formData, mercadolivre_condition: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a condição" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Novo</SelectItem>
                            <SelectItem value="used">Usado</SelectItem>
                            <SelectItem value="refurbished">Recondicionado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mercadolivre_listing_type">Tipo de Anúncio</Label>
                        <Select value={formData.mercadolivre_listing_type} onValueChange={(value) => setFormData({...formData, mercadolivre_listing_type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gold_pro">Gold Pro</SelectItem>
                            <SelectItem value="gold_special">Gold Special</SelectItem>
                            <SelectItem value="gold_premium">Gold Premium</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="bronze">Bronze</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mercadolivre_shipping">Configurações de Frete</Label>
                        <Textarea
                          id="mercadolivre_shipping"
                          value={JSON.stringify(formData.mercadolivre_shipping, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setFormData({...formData, mercadolivre_shipping: parsed});
                            } catch (error) {
                              // Ignora erros de JSON inválido
                            }
                          }}
                          placeholder='{"free_shipping": true, "local_pick_up": false}'
                          rows={4}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="mercadolivre_attributes">Atributos Específicos (JSON)</Label>
                      <Textarea
                        id="mercadolivre_attributes"
                        value={JSON.stringify(formData.mercadolivre_attributes, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setFormData({...formData, mercadolivre_attributes: parsed});
                          } catch (error) {
                            // Ignora erros de JSON inválido
                          }
                        }}
                        placeholder='{"BRAND": "Marca", "MODEL": "Modelo", "COLOR": "Cor"}'
                        rows={6}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              {isViewMode ? "Fechar" : "Cancelar"}
            </Button>
            {!isViewMode && (
              <Button onClick={handleSaveProduct} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Salvando..." : "Salvar Produto"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Categoria */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? "Edite as informações da categoria" : "Crie uma nova categoria para organizar seus produtos"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Informações Básicas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_name">Nome da Categoria *</Label>
                  <Input
                    id="category_name"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                    placeholder="Nome da categoria"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_code">Código *</Label>
                  <Input
                    id="category_code"
                    value={categoryFormData.code}
                    onChange={(e) => setCategoryFormData({...categoryFormData, code: e.target.value})}
                    placeholder="Código único"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_description">Descrição</Label>
                <Textarea
                  id="category_description"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                  placeholder="Descrição da categoria"
                  rows={3}
                />
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Configurações</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_parent">Categoria Pai</Label>
                  <Select 
                    value={categoryFormData.parent_id?.toString() || ""} 
                    onValueChange={(value) => setCategoryFormData({
                      ...categoryFormData, 
                      parent_id: value ? parseInt(value) : null
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria pai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma (Categoria Raiz)</SelectItem>
                      {categories
                        .filter(cat => cat.id !== editingCategory?.id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_sort_order">Ordem de Exibição</Label>
                  <Input
                    id="category_sort_order"
                    type="number"
                    value={categoryFormData.sort_order}
                    onChange={(e) => setCategoryFormData({...categoryFormData, sort_order: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="category_is_active"
                  checked={categoryFormData.is_active}
                  onCheckedChange={(checked) => setCategoryFormData({...categoryFormData, is_active: checked})}
                />
                <Label htmlFor="category_is_active">Categoria Ativa</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? "Atualizar" : "Criar"} Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span>Confirmar Exclusão</span>
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a categoria <strong>"{categoryToDelete?.name}"</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Informações da Categoria:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div><strong>Nome:</strong> {categoryToDelete?.name}</div>
                <div><strong>Código:</strong> {categoryToDelete?.code}</div>
                <div><strong>Produtos:</strong> {categoryToDelete?.products_count}</div>
                <div><strong>Subcategorias:</strong> {categoryToDelete?.children_count}</div>
              </div>
            </div>

            {categoryToDelete && (categoryToDelete.products_count > 0 || categoryToDelete.children_count > 0) && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive mb-1">Atenção!</p>
                    <p className="text-destructive/80">
                      Esta categoria possui {categoryToDelete.products_count} produto(s) e {categoryToDelete.children_count} subcategoria(s). 
                      A exclusão pode afetar a organização dos seus produtos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}