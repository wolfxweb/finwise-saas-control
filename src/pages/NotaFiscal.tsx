import { useState, useRef, useEffect } from "react";
import { Plus, Search, Filter, Download, Edit, Eye, Receipt, FileText, CheckCircle, Clock, Upload, FileArchive, Trash2, FileDown, ChevronUp, ChevronDown, BarChart3, DollarSign, TrendingUp, MapPin, X, CheckSquare, Square, AlertCircle, CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { notaFiscalAPI, api } from "@/services/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';

export default function NotaFiscal() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  
  // Estados para filtros
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    tipo: '',
    dataInicio: '',
    dataFim: '',
    valorMin: '',
    valorMax: '',
    cliente: '',
    numero: '',
    chaveAcesso: '',
    serie: '',
    emitente: '',
    destinatario: '',
    origem: '',
    categoria: ''
  });
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<string>('saida');
  const [importOrigin, setImportOrigin] = useState<string>('manual');
  const [importFinancialType, setImportFinancialType] = useState<string>('receita');
  const [importCategoryId, setImportCategoryId] = useState<number | null>(null);
  const [importCustomerId, setImportCustomerId] = useState<number | null>(null);
  const [importStatus, setImportStatus] = useState<string>('pending');
  const [importDueDate, setImportDueDate] = useState<Date | undefined>(undefined);
  const [shouldCreateFinancialEntry, setShouldCreateFinancialEntry] = useState<boolean>(true);
  const [handleDuplicates, setHandleDuplicates] = useState<'skip' | 'overwrite'>('skip');
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notasFiscais, setNotasFiscais] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotaFiscal, setSelectedNotaFiscal] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para paginação e ordenação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('data_emissao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Estados para estatísticas dos cards
  const [stats, setStats] = useState({
    nfsEsteMes: 0,
    nfsMesAnterior: 0,
    valorTotal: 0,
    valorMesAnterior: 0,
    pendentes: 0,
    emitidas: 0
  });

  // Estados para relatórios
  const [periodoRelatorio, setPeriodoRelatorio] = useState('ultimo_mes');
  
  // Estados para filtros de relatórios
  const [filtrosRelatorio, setFiltrosRelatorio] = useState({
    categoria: '',
    subcategoria: '',
    cliente: '',
    status: '',
    valorMin: '',
    valorMax: '',
    dataInicio: '',
    dataFim: ''
  });

  const [dadosProdutos, setDadosProdutos] = useState<any[]>([]);
  const [dadosTemporal, setDadosTemporal] = useState<any[]>([]);
  const [dadosTemporalPorCategoria, setDadosTemporalPorCategoria] = useState<any[]>([]);

  const [dadosValor, setDadosValor] = useState<any[]>([]);

  // Estados para seleção múltipla
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [useFilteredStats, setUseFilteredStats] = useState<boolean>(false);

  // Estados para filtros de rentabilidade
  const [filtroRentabilidade, setFiltroRentabilidade] = useState({
    categoria: '',
    busca: '',
    rentabilidadeMin: '',
    rentabilidadeMax: '',
    quantidadeMin: '',
    quantidadeMax: '',
    valorMin: '',
    valorMax: '',
    percentualMin: '',
    percentualMax: ''
  });
  const [ordenacaoRentabilidade, setOrdenacaoRentabilidade] = useState({
    campo: 'rentabilidade',
    direcao: 'desc' as 'asc' | 'desc'
  });

  // Estados para filtros de Pareto
  const [filtroPareto, setFiltroPareto] = useState({
    busca: '',
    pareto: '',
    quantidadeMin: '',
    quantidadeMax: '',
    valorMin: '',
    valorMax: '',
    percentualMin: '',
    percentualMax: ''
  });
  const [ordenacaoPareto, setOrdenacaoPareto] = useState({
    campo: 'valor',
    direcao: 'desc' as 'asc' | 'desc'
  });

  // Estados para filtros de Pareto por quantidade
  const [filtroParetoQuantidade, setFiltroParetoQuantidade] = useState({
    busca: '',
    pareto: '',
    quantidadeMin: '',
    quantidadeMax: '',
    valorMin: '',
    valorMax: '',
    percentualMin: '',
    percentualMax: ''
  });
  const [ordenacaoParetoQuantidade, setOrdenacaoParetoQuantidade] = useState({
    campo: 'quantidade',
    direcao: 'desc' as 'asc' | 'desc'
  });

  // Carregar notas fiscais
  useEffect(() => {
    loadNotasFiscais();
    loadCategories();
    loadCustomers();
  }, []);

  // Processar dados dos relatórios quando notas fiscais mudarem
  useEffect(() => {
    if (notasFiscais.length > 0) {
      console.log('🔄 Processando relatórios com', notasFiscais.length, 'notas fiscais');
      processarDadosRelatorios();
    }
  }, [notasFiscais, periodoRelatorio, filtrosRelatorio]);

  const loadNotasFiscais = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando notas fiscais...');
      
      // Buscar TODAS as notas fiscais da empresa
      const response = await notaFiscalAPI.getNotasFiscais();
      console.log('✅ Notas fiscais carregadas:', response.length, 'notas');
      console.log('📋 Primeira nota:', response[0]);
      
      // Verificar se há produtos nas notas fiscais
      const notasComProdutos = response.filter(nota => nota.produtos && nota.produtos.length > 0);
      console.log('📦 Notas com produtos:', notasComProdutos.length);
      
      setNotasFiscais(response);
      calculateStats(response);
    } catch (error) {
      console.error("❌ Erro ao carregar notas fiscais:", error);
      toast.error("Erro ao carregar notas fiscais");
    } finally {
      setLoading(false);
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

  const loadCustomers = async () => {
    try {
      const response = await api.get("/api/v1/customers/");
      setCustomers(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const getDefaultCustomer = async () => {
    try {
      // Tentar buscar clientes existentes
      const response = await api.get("/api/v1/customers/");
      const customers = response.data || [];
      
      if (customers.length > 0) {
        // Usar o primeiro cliente disponível
        return customers[0].id;
      } else {
        // Criar um cliente padrão se não existir nenhum
        const defaultCustomer = {
          name: "Cliente Padrão",
          email: "cliente@padrao.com",
          customer_type: "individual",
          status: "active",
          cpf: "000.000.000-00"
        };
        
        const newCustomer = await api.post("/api/v1/customers/", defaultCustomer);
        return newCustomer.data.id;
      }
    } catch (error) {
      console.error("Erro ao obter cliente padrão:", error);
      return 1; // Fallback
    }
  };

  // Função para calcular estatísticas dos cards com base em todos os dados
  const calculateStats = (notas: any[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Mês anterior
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filtrar notas do mês atual
    const notasEsteMes = notas.filter(nota => {
      const dataNota = new Date(nota.data_emissao);
      return dataNota.getMonth() === currentMonth && dataNota.getFullYear() === currentYear;
    });

    // Filtrar notas do mês anterior
    const notasMesAnterior = notas.filter(nota => {
      const dataNota = new Date(nota.data_emissao);
      return dataNota.getMonth() === lastMonth && dataNota.getFullYear() === lastYear;
    });

    // Calcular valores
    const valorTotal = notasEsteMes.reduce((sum, nota) => sum + parseFloat(nota.valor_total || 0), 0);
    const valorMesAnterior = notasMesAnterior.reduce((sum, nota) => sum + parseFloat(nota.valor_total || 0), 0);
    
    // Contar por status
    const pendentes = notasEsteMes.filter(nota => nota.status === 'pendente').length;
    const emitidas = notasEsteMes.filter(nota => nota.status === 'emitida').length;

    setStats({
      nfsEsteMes: notasEsteMes.length,
      nfsMesAnterior: notasMesAnterior.length,
      valorTotal,
      valorMesAnterior,
      pendentes,
      emitidas
    });
  };

  // Função para calcular estatísticas dos cards com base nos dados filtrados
  const calculateFilteredStats = () => {
    const filteredData = applyFilters(notasFiscais);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Mês anterior
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filtrar notas do mês atual (dos dados já filtrados)
    const notasEsteMes = filteredData.filter(nota => {
      const dataNota = new Date(nota.data_emissao);
      return dataNota.getMonth() === currentMonth && dataNota.getFullYear() === currentYear;
    });

    // Filtrar notas do mês anterior (dos dados já filtrados)
    const notasMesAnterior = filteredData.filter(nota => {
      const dataNota = new Date(nota.data_emissao);
      return dataNota.getMonth() === lastMonth && dataNota.getFullYear() === lastYear;
    });

    // Calcular valores
    const valorTotal = notasEsteMes.reduce((sum, nota) => sum + parseFloat(nota.valor_total || 0), 0);
    const valorMesAnterior = notasMesAnterior.reduce((sum, nota) => sum + parseFloat(nota.valor_total || 0), 0);
    
    // Contar por status
    const pendentes = notasEsteMes.filter(nota => nota.status === 'pendente').length;
    const emitidas = notasEsteMes.filter(nota => nota.status === 'emitida').length;

    return {
      nfsEsteMes: notasEsteMes.length,
      nfsMesAnterior: notasMesAnterior.length,
      valorTotal,
      valorMesAnterior,
      pendentes,
      emitidas
    };
  };

  const handleViewNotaFiscal = async (id: number) => {
    try {
      const notaFiscal = await notaFiscalAPI.getNotaFiscal(id);
      setSelectedNotaFiscal(notaFiscal);
      setIsViewDialogOpen(true);
      
      // Carregar PDF automaticamente
      await handleViewPDF(id);
    } catch (error) {
      console.error("Erro ao carregar nota fiscal:", error);
      toast.error("Erro ao carregar nota fiscal");
    }
  };

  const handleDeleteNotaFiscal = async (id: number) => {
    try {
      setDeletingId(id);
      await notaFiscalAPI.deleteNotaFiscal(id);
      toast.success("Nota fiscal removida com sucesso!");
      await loadNotasFiscais();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao deletar nota fiscal:", error);
      toast.error("Erro ao deletar nota fiscal");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAllNotasFiscais = async () => {
    try {
      setLoading(true);
      const totalNotas = notasFiscais.length;
      
      // Deletar todas as notas fiscais uma por uma
      for (const nota of notasFiscais) {
        await notaFiscalAPI.deleteNotaFiscal(nota.id);
      }
      
      toast.success(`${totalNotas} notas fiscais removidas com sucesso!`);
      await loadNotasFiscais();
      setIsDeleteAllDialogOpen(false);
    } catch (error) {
      console.error("Erro ao deletar todas as notas fiscais:", error);
      toast.error("Erro ao deletar todas as notas fiscais");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const validateNotaFiscalExists = async (numero: string, serie: string, emitenteCnpj: string, emitenteNome: string) => {
    try {
      const result = await notaFiscalAPI.checkNotaFiscalExists(numero, serie, emitenteCnpj, emitenteNome);
      return result.exists;
    } catch (error) {
      console.error("Erro ao verificar nota fiscal:", error);
      return false;
    }
  };

  const handleDownloadPDF = async (id: number) => {
    try {
      const blob = await notaFiscalAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nfe_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      toast.error("Erro ao baixar PDF");
    }
  };

  const handleDownloadXML = async (id: number) => {
    try {
      const blob = await notaFiscalAPI.downloadXML(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nfe_${id}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("XML baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar XML:", error);
      toast.error("Erro ao baixar XML");
    }
  };

  const handleViewPDF = async (id: number) => {
    try {
      setIsLoadingPdf(true);
      const blob = await notaFiscalAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Erro ao carregar PDF:", error);
      toast.error("Erro ao carregar PDF");
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Função para processar XML de NFe
  const parseNFeXML = (xmlContent: string) => {
    try {
      // Verificar se o conteúdo não está vazio
      if (!xmlContent || xmlContent.trim().length === 0) {
        throw new Error("XML vazio");
      }
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      
      // Verificar se é um XML válido
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        const parserError = xmlDoc.getElementsByTagName("parsererror")[0];
        const errorText = parserError?.textContent || "XML inválido";
        throw new Error(`XML inválido: ${errorText}`);
      }

      // Extrair dados da NFe - tentar com e sem namespace
      let nfe = xmlDoc.querySelector("NFe");
      if (!nfe) {
        // Tentar encontrar NFe usando getElementsByTagName
        const nfeElements = xmlDoc.getElementsByTagName('NFe');
        if (nfeElements.length > 0) {
          nfe = nfeElements[0];
        }
      }
      if (!nfe) {
        throw new Error("NFe não encontrada no XML");
      }

      // Buscar elementos usando getElementsByTagName (mais seguro)
      const getElement = (parent: Element, tagName: string) => {
        const elements = parent.getElementsByTagName(tagName);
        return elements.length > 0 ? elements[0] : null;
      };

      let ide = getElement(nfe, "ide");
      let emit = getElement(nfe, "emit");
      let dest = getElement(nfe, "dest");
      let total = getElement(nfe, "total");
      let protNFe = xmlDoc.getElementsByTagName("protNFe").length > 0 ? xmlDoc.getElementsByTagName("protNFe")[0] : null;

      if (!ide || !emit || !dest || !total) {
        const missingElements = [];
        if (!ide) missingElements.push("ide");
        if (!emit) missingElements.push("emit");
        if (!dest) missingElements.push("dest");
        if (!total) missingElements.push("total");
        throw new Error(`Dados incompletos na NFe. Elementos faltando: ${missingElements.join(", ")}`);
      }

      // Função auxiliar para buscar elementos com ou sem namespace
      const getElementText = (parent: Element, tagName: string) => {
        try {
          let element = parent.querySelector(tagName);
          if (!element) {
            // Tentar com namespace usando uma abordagem mais segura
            const allElements = parent.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const el = allElements[i];
              if (el.localName === tagName) {
                element = el;
                break;
              }
            }
          }
          return element?.textContent || "";
        } catch (error) {
          console.warn(`Erro ao buscar elemento ${tagName}:`, error);
          return "";
        }
      };

      // Extrair informações básicas
      const numero = getElementText(ide, "nNF");
      const serie = getElementText(ide, "serie");
      const dataEmissao = getElementText(ide, "dhEmi");
      const naturezaOp = getElementText(ide, "natOp");
      
      // Emitente
      const cnpjEmit = getElementText(emit, "CNPJ");
      const nomeEmit = getElementText(emit, "xNome");
      
      // Destinatário
      const cpfDest = getElementText(dest, "CPF");
      const cnpjDest = getElementText(dest, "CNPJ");
      const nomeDest = getElementText(dest, "xNome");
      
      // Valores
      const valorTotal = getElementText(total, "vNF");
      
      // Status da autorização
      const status = protNFe ? "Autorizada" : "Pendente";
      const protocolo = protNFe ? getElementText(protNFe, "nProt") : "";
      const motivo = protNFe ? getElementText(protNFe, "xMotivo") : "";
      
      // Chave de acesso
      const chaveElements = xmlDoc.getElementsByTagName("chNFe");
      const chave = chaveElements.length > 0 ? chaveElements[0].textContent || "" : "";

      return {
        numero: `${serie}-${numero}`,
        cliente: nomeDest,
        documento: cpfDest || cnpjDest,
        emitente: nomeEmit,
        cnpjEmitente: cnpjEmit,
        data: dataEmissao.split('T')[0],
        valor: parseFloat(valorTotal),
        status: status.toLowerCase(),
        tipo: naturezaOp,
        chave: chave,
        protocolo: protocolo,
        motivo: motivo,
        xmlContent: xmlContent
      };
    } catch (error) {
      console.error("Erro ao processar XML:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao processar XML: ${errorMessage}`);
    }
  };

    // Função para processar arquivo ZIP
  const processZipFile = async (file: File): Promise<any[]> => {
    try {
      console.log('📦 Iniciando processamento do ZIP:', file.name);
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      
      const zipContent = await zip.loadAsync(file);
      console.log('📦 Arquivos encontrados no ZIP:', Object.keys(zipContent.files));
      
      const promises: Promise<any>[] = [];
      
      zipContent.forEach((relativePath: string, zipEntry: any) => {
        // Ignorar arquivos do sistema macOS e diretórios
        if (zipEntry.name.startsWith('__MACOSX/') || 
            zipEntry.name.startsWith('._') || 
            zipEntry.name.includes('/._') ||
            zipEntry.name.endsWith('/')) {
          console.log('📦 Ignorando arquivo do sistema:', zipEntry.name);
          return;
        }
        
        if (zipEntry.name.endsWith('.xml')) {
          console.log('📦 Processando XML do ZIP:', zipEntry.name);
          promises.push(
            zipEntry.async('string').then((content: string) => {
              try {
                const result = parseNFeXML(content);
                if (result && result.numero) {
                  console.log('📦 XML processado com sucesso:', result.numero);
                  return result;
                } else {
                  console.warn('📦 XML processado mas sem dados válidos:', zipEntry.name);
                  return null;
                }
              } catch (error) {
                console.error(`Erro ao processar ${zipEntry.name}:`, error);
                return null;
              }
            }).catch((error) => {
              console.error(`Erro ao ler arquivo ${zipEntry.name}:`, error);
              return null;
            })
          );
        }
      });
      
      const results = await Promise.all(promises);
      const validResults = results.filter(result => result !== null);
      console.log('📦 Total de XMLs válidos processados:', validResults.length);
      return validResults;
    } catch (error) {
      console.error("Erro ao processar arquivo ZIP:", error);
      throw error;
    }
  };

  // Função para importar arquivos
  const handleImportFiles = async (files: FileList) => {
    setIsImporting(true);
    setImportProgress(0);
    setImportedCount(0);
    setImportErrors([]);
    
    const results: any[] = [];
    const errors: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setImportProgress(((i + 1) / files.length) * 100);
        
        try {
          if (file.name.endsWith('.zip')) {
            // Processar arquivo ZIP
            const zipResults = await processZipFile(file);
            results.push(...zipResults);
            setImportedCount(results.length);
          } else if (file.name.endsWith('.xml')) {
            // Processar arquivo XML individual
            const content = await file.text();
            const result = parseNFeXML(content);
            results.push(result);
            setImportedCount(results.length);
          } else {
            errors.push(`${file.name}: Formato não suportado`);
          }
        } catch (error) {
          errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }
      
      setImportErrors(errors);
      
      if (results.length > 0) {
        // Adicionar informações de tipo e origem aos resultados
        const enrichedResults = results.map(result => ({
          ...result,
          tipo: importType,
          origem: importOrigin,
          dataImportacao: new Date().toISOString()
        }));
        
        // Aqui você pode salvar os resultados no banco de dados
        console.log("Notas fiscais importadas:", enrichedResults);
        // TODO: Implementar salvamento no backend
      }
      
    } catch (error) {
      console.error("Erro na importação:", error);
      setImportErrors([`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Função para abrir modal de importação
  const handleImportClick = () => {
    setIsImportDialogOpen(true);
  };

  // Função para lidar com mudança de arquivos
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
    }
  };

  // Função para confirmar importação
  const handleConfirmImport = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportedCount(0);
    setImportErrors([]);

    try {
      const totalFiles = selectedFiles.length;
      let processedCount = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        try {
          if (file.name.endsWith('.xml')) {
            const xmlContent = await file.text();
            
            // Importar via API
            const response = await notaFiscalAPI.importNotaFiscal({
              xml_content: xmlContent,
              xml_filename: file.name,
              tipo: importType,
              origem: importOrigin,
              handle_duplicates: handleDuplicates
            });
            
            console.log('📄 Resposta da API:', response);
            console.log('📄 Valor de handleDuplicates:', handleDuplicates, 'Tipo:', typeof handleDuplicates);
            
            // Verificar se houve erro na importação
            if (!response.success) {
              console.warn('⚠️ Nota fiscal não importada:', response.message);
              
              // Se for erro de duplicata, mostrar como aviso
              if (response.message && response.message.includes('Já existe uma nota fiscal')) {
                toast.warning(`Nota fiscal ${file.name} já existe no sistema`);
              } else {
                const errorMessage = `Erro ao importar ${file.name}: ${response.message}`;
                setImportErrors(prev => [...prev, errorMessage]);
                toast.error(errorMessage);
              }
              continue;
            }
            
            // Extrair dados da nota fiscal da resposta
            const notaFiscal = response.data;
            
            console.log('📄 Nota fiscal extraída:', notaFiscal);
            
            // Verificar se os dados da nota fiscal são válidos
            if (!notaFiscal || !notaFiscal.numero) {
              console.error('❌ Dados da nota fiscal inválidos:', notaFiscal);
              const errorMessage = `Erro: Dados inválidos da nota fiscal para ${file.name}`;
              setImportErrors(prev => [...prev, errorMessage]);
              toast.error(errorMessage);
              continue;
            }
            
            // Criar lançamento financeiro se solicitado
            if (shouldCreateFinancialEntry) {
              await createFinancialEntry(notaFiscal);
              toast.success(`Nota fiscal ${file.name} importada e lançamento criado com sucesso!`);
            } else {
              toast.success(`Nota fiscal ${file.name} importada com sucesso!`);
            }
            
            processedCount++;
          } else if (file.name.endsWith('.zip')) {
            // Processar arquivo ZIP
            const zipResults = await processZipFile(file);
            
            // Importar cada XML do ZIP
            for (const xmlData of zipResults) {
              try {
                // Extrair número da nota fiscal do formato "serie-numero"
                const numeroNota = xmlData.numero.split('-')[1] || xmlData.numero;
                console.log('📦 Processando XML do ZIP:', numeroNota, 'Tipo:', importType, 'Origem:', importOrigin, 'Duplicatas:', handleDuplicates);
                
                console.log('📦 Enviando XML para API:', {
                  filename: numeroNota + '.xml',
                  tipo: importType,
                  origem: importOrigin,
                  handle_duplicates: handleDuplicates,
                  xmlSize: xmlData.xmlContent.length
                });
                console.log('📦 Valor de handleDuplicates:', handleDuplicates, 'Tipo:', typeof handleDuplicates);
                
                const response = await notaFiscalAPI.importNotaFiscal({
                  xml_content: xmlData.xmlContent,
                  xml_filename: numeroNota + '.xml',
                  tipo: importType,
                  origem: importOrigin,
                  handle_duplicates: handleDuplicates
                });
                
                console.log('📄 Resposta da API (ZIP):', response);
                
                // Verificar se houve erro na importação
                if (!response.success) {
                  console.warn('⚠️ Nota fiscal não importada (ZIP):', response.message);
                  
                  // Se for erro de duplicata, mostrar como aviso
                  if (response.message && response.message.includes('Já existe uma nota fiscal')) {
                    toast.warning(`Nota fiscal ${numeroNota} já existe no sistema`);
                  } else {
                    const errorMessage = `Erro ao importar ${numeroNota}: ${response.message}`;
                    setImportErrors(prev => [...prev, errorMessage]);
                    toast.error(errorMessage);
                  }
                  continue;
                }
                
                // Extrair dados da nota fiscal da resposta
                const notaFiscal = response.data;
                
                console.log('📄 Nota fiscal extraída (ZIP):', notaFiscal);
                
                // Verificar se os dados da nota fiscal são válidos
                if (!notaFiscal || !notaFiscal.numero) {
                  console.error('❌ Dados da nota fiscal inválidos (ZIP):', notaFiscal);
                  const errorMessage = `Erro: Dados inválidos da nota fiscal para ${xmlData.numero}`;
                  setImportErrors(prev => [...prev, errorMessage]);
                  toast.error(errorMessage);
                  continue;
                }
                
                // Criar lançamento financeiro se solicitado
                if (shouldCreateFinancialEntry) {
                  await createFinancialEntry(notaFiscal);
                  toast.success(`Nota fiscal ${numeroNota} importada e lançamento criado com sucesso!`);
                } else {
                  toast.success(`Nota fiscal ${numeroNota} importada com sucesso!`);
                }
                
                processedCount++;
              } catch (error) {
                const errorMessage = `Erro ao importar nota ${xmlData.numero}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
                setImportErrors(prev => [...prev, errorMessage]);
                toast.error(errorMessage);
              }
            }
          }
          
          setImportProgress(((i + 1) / totalFiles) * 100);
        } catch (error) {
          const errorMessage = `Erro no arquivo ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          setImportErrors(prev => [...prev, errorMessage]);
          toast.error(errorMessage);
        }
      }

      setImportedCount(processedCount);
      setIsImportDialogOpen(false);
      
      // Recarregar lista de notas fiscais
      await loadNotasFiscais();
      
      if (processedCount > 0) {
        if (shouldCreateFinancialEntry) {
          toast.success(`${processedCount} nota(s) fiscal(is) importada(s) e lançamento(s) criado(s) com sucesso!`);
        } else {
          toast.success(`${processedCount} nota(s) fiscal(is) importada(s) com sucesso!`);
        }
      }
    } catch (error) {
      console.error("Erro durante importação:", error);
      toast.error("Erro durante a importação");
    } finally {
      setIsImporting(false);
    }
  };

  // Função para criar lançamento financeiro automaticamente
  const createFinancialEntry = async (notaFiscal: any) => {
    let receitaData: any = null;
    
    try {
      // Verificar se notaFiscal existe
      if (!notaFiscal) {
        console.error('❌ Nota fiscal é null ou undefined');
        return;
      }
      
      console.log('🔍 Criando lançamento financeiro para NF:', notaFiscal);
      console.log('📊 Dados da NF:', {
        numero: notaFiscal.numero,
        numero_nota: notaFiscal.numero_nota,
        chave_acesso: notaFiscal.chave_acesso,
        destinatario_nome: notaFiscal.destinatario_nome,
        destinatario_id: notaFiscal.destinatario_id,
        valor_total: notaFiscal.valor_total,
        valor_produtos: notaFiscal.valor_produtos,
        valor_icms: notaFiscal.valor_icms,
        valor_ipi: notaFiscal.valor_ipi,
        valor_pis: notaFiscal.valor_pis,
        valor_cofins: notaFiscal.valor_cofins,
        valor_frete: notaFiscal.valor_frete,
        data_emissao: notaFiscal.data_emissao
      });
      console.log('⚙️ Configurações de importação:', {
        importFinancialType,
        importCategoryId,
        importCustomerId,
        importStatus
      });

      // Usar o tipo financeiro selecionado pelo usuário
      if (importFinancialType === 'receita') {
        // Usar cliente selecionado ou cliente padrão se não houver destinatário_id
        const customerId = importCustomerId || notaFiscal.destinatario_id || await getDefaultCustomer();
        
        // Calcular valor total da nota fiscal
        const valorTotal = parseFloat(notaFiscal.valor_total) || 
                          parseFloat(notaFiscal.valor_produtos) || 
                          (parseFloat(notaFiscal.valor_produtos || 0) + 
                           parseFloat(notaFiscal.valor_icms || 0) + 
                           parseFloat(notaFiscal.valor_ipi || 0) + 
                           parseFloat(notaFiscal.valor_pis || 0) + 
                           parseFloat(notaFiscal.valor_cofins || 0) + 
                           parseFloat(notaFiscal.valor_frete || 0));

        console.log('💰 Valor total calculado:', valorTotal);

        // Converter data_emissao de datetime para date (remover hora)
        const entryDate = notaFiscal.data_emissao ? 
          new Date(notaFiscal.data_emissao).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0];

        console.log('📅 Data de vencimento configurada:', importDueDate ? format(importDueDate, "dd/MM/yyyy") : 'Data atual (padrão)');

        // Definir valores baseados no status
        const paidAmount = importStatus === 'paid' ? valorTotal : 0;
        const paymentDate = importStatus === 'paid' ? new Date().toISOString().split('T')[0] : null;

        // Usar data de vencimento informada pelo usuário ou data atual como padrão
        const dueDate = importDueDate ? 
          importDueDate.toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0];

        // Criar conta a receber
        receitaData = {
          description: `NF ${notaFiscal.numero || notaFiscal.numero_nota} - ${notaFiscal.destinatario_nome || 'Cliente'}`,
          customer_id: customerId,
          category_id: importCategoryId,
          receivable_type: 'cash',
          total_amount: valorTotal,
          entry_date: entryDate, // Data de emissão da nota como data de entrada (apenas data, sem hora)
          due_date: dueDate, // Data de vencimento informada pelo usuário ou data atual
          notes: `Importado automaticamente da NF ${notaFiscal.numero || notaFiscal.numero_nota}`,
          reference: notaFiscal.numero || notaFiscal.numero_nota || notaFiscal.chave_acesso, // Número da nota fiscal como referência
          status: importStatus, // Status selecionado na importação
          paid_amount: paidAmount, // Valor pago se status for 'paid'
          payment_date: paymentDate, // Data de pagamento se status for 'paid'
          // Campos obrigatórios para parcelamento (valores padrão)
          total_installments: 1,
          installment_interval_days: 30
        };

        console.log('📝 Dados da receita a ser criada:', receitaData);

        const response = await api.post("/api/v1/accounts-receivable/", receitaData);
        console.log('✅ Conta a receber criada com sucesso:', response.data);
      } else {
        // Criar conta a pagar (quando implementado)
        // Por enquanto, apenas log
        console.log('Conta a pagar seria criada para NF:', notaFiscal.numero);
      }
    } catch (error) {
      console.error("❌ Erro ao criar lançamento financeiro:", error);
      console.error("📋 Detalhes do erro:", {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        response: error instanceof Error && 'response' in error ? error.response : null
      });
      
      // Mostrar detalhes específicos do erro 422
      if (error instanceof Error && 'response' in error && (error as any).response?.status === 422) {
        console.error("🔍 Erro de validação (422):", (error as any).response.data);
        console.error("📝 Dados que causaram erro:", receitaData);
      }
      
      // Não interromper o processo de importação se falhar o lançamento
    }
  };

  // Função para cancelar importação
  const handleCancelImport = () => {
    setIsImportDialogOpen(false);
    setSelectedFiles(null);
    setImportType('saida');
    setImportOrigin('manual');
    setImportFinancialType('receita');
    setImportCategoryId(null);
    setImportCustomerId(null);
    setImportStatus('pending');
    setShouldCreateFinancialEntry(true);
  };

  const mockData = [
    { 
      id: 1, 
      numero: "NF-2024-001", 
      cliente: "João Silva", 
      data: "2024-01-15",
      valor: 1250,
      status: "emitida",
      tipo: "Venda",
      chave: "35240112345678901234567890123456789012345678"
    },
    { 
      id: 2, 
      numero: "NF-2024-002", 
      cliente: "Maria Santos", 
      data: "2024-01-14",
      valor: 890,
      status: "pendente",
      tipo: "Venda",
      chave: "35240112345678901234567890123456789012345679"
    },
    { 
      id: 3, 
      numero: "NF-2024-003", 
      cliente: "Pedro Costa", 
      data: "2024-01-13",
      valor: 2100,
      status: "cancelada",
      tipo: "Venda",
      chave: "35240112345678901234567890123456789012345680"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "emitida":
        return <Badge variant="default">Emitida</Badge>;
      case "cancelada":
        return <Badge variant="destructive">Cancelada</Badge>;
      case "denegada":
        return <Badge variant="destructive">Denegada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Função para ordenar dados
  const sortData = (data: any[]) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Tratamento especial para campos específicos
      if (sortField === 'data_emissao') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === 'valor_total') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortField === 'numero') {
        // Extrair números do campo número para ordenação numérica
        const aNum = parseInt(aValue.toString().replace(/\D/g, '')) || 0;
        const bNum = parseInt(bValue.toString().replace(/\D/g, '')) || 0;
        aValue = aNum;
        bValue = bNum;
      } else {
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Função para lidar com ordenação
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset para primeira página ao ordenar
  };

  // Função para aplicar filtros
  const applyFilters = (data: any[]) => {
    return data.filter(nota => {
      // Filtro por busca geral
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          nota.numero?.toLowerCase().includes(searchLower) ||
          nota.destinatario_nome?.toLowerCase().includes(searchLower) ||
          nota.emitente_nome?.toLowerCase().includes(searchLower) ||
          nota.xml_filename?.toLowerCase().includes(searchLower) ||
          nota.chave_acesso?.toLowerCase().includes(searchLower) ||
          nota.serie?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro por status
      if (filters.status && nota.status !== filters.status) return false;

      // Filtro por tipo
      if (filters.tipo && nota.tipo !== filters.tipo) return false;

      // Filtro por número
      if (filters.numero && !nota.numero?.includes(filters.numero)) return false;

      // Filtro por cliente
      if (filters.cliente && !nota.destinatario_nome?.toLowerCase().includes(filters.cliente.toLowerCase())) return false;

      // Filtro por chave de acesso
      if (filters.chaveAcesso && !nota.chave_acesso?.includes(filters.chaveAcesso)) return false;

      // Filtro por série
      if (filters.serie && !nota.serie?.includes(filters.serie)) return false;

      // Filtro por emitente
      if (filters.emitente && !nota.emitente_nome?.toLowerCase().includes(filters.emitente.toLowerCase())) return false;

      // Filtro por destinatário
      if (filters.destinatario && !nota.destinatario_nome?.toLowerCase().includes(filters.destinatario.toLowerCase())) return false;

      // Filtro por origem
      if (filters.origem && nota.origem !== filters.origem) return false;

      // Filtro por categoria
      if (filters.categoria && nota.categoria_id !== parseInt(filters.categoria)) return false;

      // Filtro por data
      if (filters.dataInicio || filters.dataFim) {
        const dataNota = new Date(nota.data_emissao);
        if (filters.dataInicio) {
          const dataInicio = new Date(filters.dataInicio);
          if (dataNota < dataInicio) return false;
        }
        if (filters.dataFim) {
          const dataFim = new Date(filters.dataFim);
          dataFim.setHours(23, 59, 59, 999); // Incluir todo o dia
          if (dataNota > dataFim) return false;
        }
      }

      // Filtro por valor
      const valorNota = parseFloat(nota.valor_total || 0);
      if (filters.valorMin && valorNota < parseFloat(filters.valorMin)) return false;
      if (filters.valorMax && valorNota > parseFloat(filters.valorMax)) return false;

      return true;
    });
  };

  // Função para obter dados paginados e ordenados
  const getPaginatedData = () => {
    const filteredData = applyFilters(notasFiscais);
    const sortedData = sortData(filteredData);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  // Função para obter total de páginas
  const getTotalPages = () => {
    const filteredData = applyFilters(notasFiscais);
    return Math.ceil(filteredData.length / itemsPerPage);
  };

  // Função para renderizar ícone de ordenação
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  // Função para calcular variação percentual
  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Função para formatar variação
  const formatVariation = (variation: number) => {
    const sign = variation >= 0 ? '+' : '';
    const color = variation >= 0 ? 'text-green-600' : 'text-red-600';
    return { text: `${sign}${variation.toFixed(1)}%`, color };
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      status: '',
      tipo: '',
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
      cliente: '',
      numero: '',
      chaveAcesso: '',
      serie: '',
      emitente: '',
      destinatario: '',
      origem: '',
      categoria: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
    setUseFilteredStats(false);
  };

  // Função para aplicar filtros
  const handleApplyFilters = () => {
    setCurrentPage(1);
    setIsFilterDialogOpen(false);
    setUseFilteredStats(true);
  };

  // Função para verificar se há filtros ativos
  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '') || searchTerm !== '';
  };

  const limparFiltrosRelatorio = () => {
    setFiltrosRelatorio({
      categoria: '',
      subcategoria: '',
      cliente: '',
      status: '',
      valorMin: '',
      valorMax: '',
      dataInicio: '',
      dataFim: ''
    });
  };

  const hasActiveFiltersRelatorio = () => {
    return Object.values(filtrosRelatorio).some(value => value !== '');
  };

  // Funções para relatórios
  const processarDadosRelatorios = () => {
    let dadosFiltrados = filtrarPorPeriodo(notasFiscais, periodoRelatorio);
    
    // Aplicar filtros adicionais de relatório
    dadosFiltrados = aplicarFiltrosRelatorio(dadosFiltrados);
    
    console.log('📊 Dados filtrados para relatórios:', dadosFiltrados.length);

    // Dados por produtos
    const produtos = processarDadosProdutos(dadosFiltrados);
    console.log('📦 Dados de produtos processados:', produtos.length, 'produtos');
    setDadosProdutos(produtos);

    // Dados temporais
    const temporal = processarDadosTemporal(dadosFiltrados);
    setDadosTemporal(temporal);

    // Dados temporais por categoria
    const temporalPorCategoria = processarDadosTemporalPorCategoria(dadosFiltrados);
    setDadosTemporalPorCategoria(temporalPorCategoria);

    // Dados por faixa de valor
    const valor = processarDadosValor(dadosFiltrados);
    setDadosValor(valor);
  };

  const aplicarFiltrosRelatorio = (dados: any[]) => {
    return dados.filter(nota => {
      // Filtro por categoria
      if (filtrosRelatorio.categoria && nota.categoria_id?.toString() !== filtrosRelatorio.categoria) {
        return false;
      }
      
      // Filtro por subcategoria (categoria filha)
      if (filtrosRelatorio.subcategoria && nota.categoria_id?.toString() !== filtrosRelatorio.subcategoria) {
        return false;
      }
      
      // Filtro por cliente
      if (filtrosRelatorio.cliente && !nota.destinatario_nome?.toLowerCase().includes(filtrosRelatorio.cliente.toLowerCase())) {
        return false;
      }
      
      // Filtro por status
      if (filtrosRelatorio.status && nota.status !== filtrosRelatorio.status) {
        return false;
      }
      
      // Filtro por valor mínimo
      if (filtrosRelatorio.valorMin && parseFloat(nota.valor_total || 0) < parseFloat(filtrosRelatorio.valorMin)) {
        return false;
      }
      
      // Filtro por valor máximo
      if (filtrosRelatorio.valorMax && parseFloat(nota.valor_total || 0) > parseFloat(filtrosRelatorio.valorMax)) {
        return false;
      }
      
      // Filtro por data início
      if (filtrosRelatorio.dataInicio) {
        const dataNota = new Date(nota.data_emissao);
        const dataInicio = new Date(filtrosRelatorio.dataInicio);
        if (dataNota < dataInicio) {
          return false;
        }
      }
      
      // Filtro por data fim
      if (filtrosRelatorio.dataFim) {
        const dataNota = new Date(nota.data_emissao);
        const dataFim = new Date(filtrosRelatorio.dataFim);
        if (dataNota > dataFim) {
          return false;
        }
      }
      
      return true;
    });
  };

  const filtrarPorPeriodo = (dados: any[], periodo: string) => {
    const agora = new Date();
    const inicio = new Date();

    switch (periodo) {
      case 'ultima_semana':
        inicio.setDate(agora.getDate() - 7);
        break;
      case 'ultimo_mes':
        inicio.setMonth(agora.getMonth() - 1);
        break;
      case 'ultimos_3_meses':
        inicio.setMonth(agora.getMonth() - 3);
        break;
      case 'ultimo_ano':
        inicio.setFullYear(agora.getFullYear() - 1);
        break;
      default:
        return dados;
    }

    return dados.filter(nota => {
      const dataNota = new Date(nota.data_emissao);
      return dataNota >= inicio && dataNota <= agora;
    });
  };



  const processarDadosProdutos = (dados: any[]) => {
    console.log('🔍 Processando dados de produtos:', dados.length, 'notas fiscais');
    
    const produtos: { [key: string]: { 
      quantidade: number; 
      valor: number; 
      descricao: string;
      valor_unitario_total: number;
      contador: number;
    } } = {};
    
    dados.forEach((nota, index) => {
      console.log(`📄 Nota ${index + 1}:`, {
        id: nota.id,
        numero: nota.numero,
        produtos: nota.produtos ? nota.produtos.length : 0
      });
      
      // Usar a tabela notas_fiscais_produtos através do relacionamento
      if (nota.produtos && Array.isArray(nota.produtos)) {
        nota.produtos.forEach((produto: any) => {
          // Usar a coluna codigo da tabela notas_fiscais_produtos
          const codigo = produto.codigo || 'Sem código';
          if (!produtos[codigo]) {
            produtos[codigo] = { 
              quantidade: 0, 
              valor: 0, 
              descricao: produto.descricao || 'Sem descrição',
              valor_unitario_total: 0,
              contador: 0
            };
          }
          produtos[codigo].quantidade += parseFloat(produto.quantidade || 0);
          produtos[codigo].valor += parseFloat(produto.valor_total || 0);
          produtos[codigo].valor_unitario_total += parseFloat(produto.valor_unitario || 0);
          produtos[codigo].contador += 1;
        });
      }
    });

    const resultado = Object.entries(produtos)
      .map(([codigo, dados]) => ({
        codigo,
        descricao: dados.descricao,
        quantidade: dados.quantidade,
        valor: dados.valor,
        valor_unitario_medio: dados.contador > 0 ? dados.valor_unitario_total / dados.contador : 0
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 15);
    
    console.log('📊 Resultado produtos:', resultado);
    return resultado;
  };

  const processarDadosTemporalPorCategoria = (dados: any[]) => {
    const temporalPorCategoria: { [key: string]: { [key: string]: { quantidade: number; valor: number } } } = {};
    
    dados.forEach(nota => {
      const data = new Date(nota.data_emissao);
      const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
      
      // Obter categoria da nota
      const categoriaNome = nota.categoria_nome || 'Sem Categoria';
      
      if (!temporalPorCategoria[mesAno]) {
        temporalPorCategoria[mesAno] = {};
      }
      
      if (!temporalPorCategoria[mesAno][categoriaNome]) {
        temporalPorCategoria[mesAno][categoriaNome] = { quantidade: 0, valor: 0 };
      }
      
      temporalPorCategoria[mesAno][categoriaNome].quantidade += 1;
      temporalPorCategoria[mesAno][categoriaNome].valor += parseFloat(nota.valor_total || 0);
    });

    // Converter para formato de linha do gráfico
    const resultado: any[] = [];
    
    Object.entries(temporalPorCategoria).forEach(([periodo, categorias]) => {
      const linha: any = { periodo };
      
      Object.entries(categorias).forEach(([categoria, dados]) => {
        linha[categoria] = dados.valor;
      });
      
      resultado.push(linha);
    });

    return resultado.sort((a, b) => {
      const [mesA, anoA] = a.periodo.split('/');
      const [mesB, anoB] = b.periodo.split('/');
      return new Date(parseInt(anoA), parseInt(mesA) - 1).getTime() - new Date(parseInt(anoB), parseInt(mesB) - 1).getTime();
    });
  };

  const processarDadosTemporal = (dados: any[]) => {
    const temporal: { [key: string]: { quantidade: number; valor: number } } = {};
    
    dados.forEach(nota => {
      const data = new Date(nota.data_emissao);
      const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
      
      if (!temporal[mesAno]) {
        temporal[mesAno] = { quantidade: 0, valor: 0 };
      }
      temporal[mesAno].quantidade += 1;
      temporal[mesAno].valor += parseFloat(nota.valor_total || 0);
    });

    return Object.entries(temporal)
      .map(([periodo, dados]) => ({
        periodo,
        quantidade: dados.quantidade,
        valor: dados.valor
      }))
      .sort((a, b) => {
        const [mesA, anoA] = a.periodo.split('/');
        const [mesB, anoB] = b.periodo.split('/');
        return new Date(parseInt(anoA), parseInt(mesA) - 1).getTime() - new Date(parseInt(anoB), parseInt(mesB) - 1).getTime();
      });
  };



  const processarDadosValor = (dados: any[]) => {
    const faixas = [
      { nome: 'R$ 0 - R$ 30', min: 0, max: 30 },
      { nome: 'R$ 30 - R$ 60', min: 30, max: 60 },
      { nome: 'R$ 60 - R$ 100', min: 60, max: 100 },
      { nome: 'R$ 100 - R$ 150', min: 100, max: 150 },
      { nome: 'Acima de R$ 150', min: 150, max: Infinity }
    ];

    const contadores = faixas.map(faixa => {
      const notasNaFaixa = dados.filter(nota => {
        const valor = parseFloat(nota.valor_total || 0);
        return valor >= faixa.min && valor < faixa.max;
      });
      
      const quantidade = notasNaFaixa.length;
      const valorTotal = notasNaFaixa.reduce((sum, nota) => sum + parseFloat(nota.valor_total || 0), 0);
      
      return {
        faixa: faixa.nome,
        quantidade,
        valor_total: valorTotal
      };
    });

    return contadores.filter(item => item.quantidade > 0);
  };



  // Funções para análise de rentabilidade usando Curva ABC
  const getCategoriaABC = (valor: number, todosProdutos: any[]) => {
    if (todosProdutos.length === 0) return 'C';
    
    // Ordenar produtos por valor (decrescente)
    const produtosOrdenados = [...todosProdutos].sort((a, b) => b.valor - a.valor);
    
    // Calcular faturamento total
    const faturamentoTotal = produtosOrdenados.reduce((sum, p) => sum + p.valor, 0);
    
    // Calcular percentual acumulado para cada produto
    let percentualAcumulado = 0;
    let categoria = 'C';
    
    for (const produto of produtosOrdenados) {
      const percentualProduto = (produto.valor / faturamentoTotal) * 100;
      percentualAcumulado += percentualProduto;
      
      if (produto.valor === valor) {
        // Classificar baseado no percentual acumulado (Curva ABC)
        if (percentualAcumulado <= 80) {
          categoria = 'A'; // 80% do faturamento - produtos mais importantes
        } else if (percentualAcumulado <= 95) {
          categoria = 'B'; // 15% do faturamento - produtos de importância média
        } else {
          categoria = 'C'; // 5% do faturamento - produtos menos importantes
        }
        break;
      }
    }
    
    return categoria;
  };

  const getRowClassByCategoria = (categoria: string) => {
    switch (categoria) {
      case 'A': return 'bg-green-50 font-semibold border-l-4 border-l-green-500';
      case 'B': return 'bg-yellow-50 font-semibold border-l-4 border-l-yellow-500';
      case 'C': return 'bg-red-50 border-l-4 border-l-red-500';
      default: return '';
    }
  };

  const getBadgeVariantByCategoria = (categoria: string) => {
    switch (categoria) {
      case 'A': return 'default';
      case 'B': return 'default';
      case 'C': return 'destructive';
      default: return 'secondary';
    }
  };

  const getBadgeClassByCategoria = (categoria: string) => {
    switch (categoria) {
      case 'A': return 'bg-green-600 text-white font-bold';
      case 'B': return 'bg-yellow-600 text-white font-bold';
      case 'C': return 'bg-red-600 text-white';
      default: return '';
    }
  };

  // Funções para processar dados de rentabilidade
  const processarDadosRentabilidade = () => {
    if (dadosProdutos.length === 0) return [];

    // Calcular faturamento total para percentual
    const faturamentoTotal = dadosProdutos.reduce((sum, produto) => sum + produto.valor, 0);

    // Calcular métricas de rentabilidade
    const produtosComRentabilidade = dadosProdutos.map(produto => {
      const rentabilidade = produto.quantidade > 0 ? produto.valor / produto.quantidade : 0;
      const percentualFaturamento = faturamentoTotal > 0 ? (produto.valor / faturamentoTotal) * 100 : 0;
      return {
        ...produto,
        rentabilidade,
        percentual_faturamento: percentualFaturamento,
        categoria: getCategoriaABC(produto.valor, dadosProdutos)
      };
    });

    // Aplicar filtros
    let dadosFiltrados = produtosComRentabilidade.filter(produto => {
      // Filtro por categoria
      if (filtroRentabilidade.categoria && produto.categoria !== filtroRentabilidade.categoria) {
        return false;
      }

      // Filtro por busca
      if (filtroRentabilidade.busca) {
        const busca = filtroRentabilidade.busca.toLowerCase();
        const matchCodigo = produto.codigo.toLowerCase().includes(busca);
        const matchDescricao = produto.descricao.toLowerCase().includes(busca);
        if (!matchCodigo && !matchDescricao) return false;
      }

      // Filtro por rentabilidade
      if (filtroRentabilidade.rentabilidadeMin && produto.rentabilidade < parseFloat(filtroRentabilidade.rentabilidadeMin)) {
        return false;
      }
      if (filtroRentabilidade.rentabilidadeMax && produto.rentabilidade > parseFloat(filtroRentabilidade.rentabilidadeMax)) {
        return false;
      }

      // Filtro por quantidade
      if (filtroRentabilidade.quantidadeMin && produto.quantidade < parseFloat(filtroRentabilidade.quantidadeMin)) {
        return false;
      }
      if (filtroRentabilidade.quantidadeMax && produto.quantidade > parseFloat(filtroRentabilidade.quantidadeMax)) {
        return false;
      }

      // Filtro por valor
      if (filtroRentabilidade.valorMin && produto.valor < parseFloat(filtroRentabilidade.valorMin)) {
        return false;
      }
      if (filtroRentabilidade.valorMax && produto.valor > parseFloat(filtroRentabilidade.valorMax)) {
        return false;
      }

      // Filtro por percentual de faturamento
      if (filtroRentabilidade.percentualMin && produto.percentual_faturamento < parseFloat(filtroRentabilidade.percentualMin)) {
        return false;
      }
      if (filtroRentabilidade.percentualMax && produto.percentual_faturamento > parseFloat(filtroRentabilidade.percentualMax)) {
        return false;
      }

      return true;
    });

    // Aplicar ordenação
    dadosFiltrados.sort((a, b) => {
      let aValue = a[ordenacaoRentabilidade.campo];
      let bValue = b[ordenacaoRentabilidade.campo];

      // Tratamento especial para campos numéricos
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (ordenacaoRentabilidade.direcao === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      // Tratamento para strings
      aValue = aValue?.toString().toLowerCase() || '';
      bValue = bValue?.toString().toLowerCase() || '';

      if (ordenacaoRentabilidade.direcao === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return dadosFiltrados;
  };

  const handleOrdenacaoRentabilidade = (campo: string) => {
    if (ordenacaoRentabilidade.campo === campo) {
      setOrdenacaoRentabilidade(prev => ({
        ...prev,
        direcao: prev.direcao === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setOrdenacaoRentabilidade({
        campo,
        direcao: 'asc'
      });
    }
  };

  const limparFiltrosRentabilidade = () => {
    setFiltroRentabilidade({
      categoria: '',
      busca: '',
      rentabilidadeMin: '',
      rentabilidadeMax: '',
      quantidadeMin: '',
      quantidadeMax: '',
      valorMin: '',
      valorMax: '',
      percentualMin: '',
      percentualMax: ''
    });
  };

  const getIconeOrdenacao = (campo: string) => {
    if (ordenacaoRentabilidade.campo !== campo) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return ordenacaoRentabilidade.direcao === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  // Funções para processar dados de Pareto
  const processarDadosPareto = () => {
    if (dadosProdutos.length === 0) return [];

    // Calcular Pareto
    const total = dadosProdutos.reduce((sum, p) => sum + p.valor, 0);
    let acumulado = 0;
    let atingiu80 = false;
    
    const produtosComPareto = dadosProdutos.map((p, idx) => {
      const percentual = total > 0 ? (p.valor / total) * 100 : 0;
      acumulado += percentual;
      const isPareto = !atingiu80 && acumulado <= 80;
      if (acumulado >= 80) atingiu80 = true;
      
      return {
        ...p,
        percentual,
        isPareto
      };
    });

    // Aplicar filtros
    let dadosFiltrados = produtosComPareto.filter(produto => {
      // Filtro por busca
      if (filtroPareto.busca) {
        const busca = filtroPareto.busca.toLowerCase();
        const matchCodigo = produto.codigo.toLowerCase().includes(busca);
        const matchDescricao = produto.descricao.toLowerCase().includes(busca);
        if (!matchCodigo && !matchDescricao) return false;
      }

      // Filtro por Pareto
      if (filtroPareto.pareto) {
        if (filtroPareto.pareto === 'sim' && !produto.isPareto) return false;
        if (filtroPareto.pareto === 'nao' && produto.isPareto) return false;
      }

      // Filtro por quantidade
      if (filtroPareto.quantidadeMin && produto.quantidade < parseFloat(filtroPareto.quantidadeMin)) {
        return false;
      }
      if (filtroPareto.quantidadeMax && produto.quantidade > parseFloat(filtroPareto.quantidadeMax)) {
        return false;
      }

      // Filtro por valor
      if (filtroPareto.valorMin && produto.valor < parseFloat(filtroPareto.valorMin)) {
        return false;
      }
      if (filtroPareto.valorMax && produto.valor > parseFloat(filtroPareto.valorMax)) {
        return false;
      }

      // Filtro por percentual
      if (filtroPareto.percentualMin && produto.percentual < parseFloat(filtroPareto.percentualMin)) {
        return false;
      }
      if (filtroPareto.percentualMax && produto.percentual > parseFloat(filtroPareto.percentualMax)) {
        return false;
      }

      return true;
    });

    // Aplicar ordenação
    dadosFiltrados.sort((a, b) => {
      let aValue = a[ordenacaoPareto.campo];
      let bValue = b[ordenacaoPareto.campo];

      // Tratamento especial para campos numéricos
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (ordenacaoPareto.direcao === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      // Tratamento para strings
      aValue = aValue?.toString().toLowerCase() || '';
      bValue = bValue?.toString().toLowerCase() || '';

      if (ordenacaoPareto.direcao === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return dadosFiltrados;
  };

  const handleOrdenacaoPareto = (campo: string) => {
    if (ordenacaoPareto.campo === campo) {
      setOrdenacaoPareto(prev => ({
        ...prev,
        direcao: prev.direcao === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setOrdenacaoPareto({
        campo,
        direcao: 'asc'
      });
    }
  };

  const limparFiltrosPareto = () => {
    setFiltroPareto({
      busca: '',
      pareto: '',
      quantidadeMin: '',
      quantidadeMax: '',
      valorMin: '',
      valorMax: '',
      percentualMin: '',
      percentualMax: ''
    });
  };

  const getIconeOrdenacaoPareto = (campo: string) => {
    if (ordenacaoPareto.campo !== campo) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return ordenacaoPareto.direcao === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  // Funções para processar dados de Pareto por quantidade
  const processarDadosParetoQuantidade = () => {
    if (dadosProdutos.length === 0) return [];

    // Ordenar por quantidade para análise de Pareto
    const produtosPorQuantidade = [...dadosProdutos].sort((a, b) => b.quantidade - a.quantidade);
    
    // Calcular Pareto por quantidade
    const totalQuantidade = produtosPorQuantidade.reduce((sum, p) => sum + p.quantidade, 0);
    let acumulado = 0;
    let atingiu80 = false;
    
    const produtosComPareto = produtosPorQuantidade.map((p, idx) => {
      const percentual = totalQuantidade > 0 ? (p.quantidade / totalQuantidade) * 100 : 0;
      acumulado += percentual;
      const isPareto = !atingiu80 && acumulado <= 80;
      if (acumulado >= 80) atingiu80 = true;
      
      return {
        ...p,
        percentual,
        isPareto
      };
    });

    // Aplicar filtros
    let dadosFiltrados = produtosComPareto.filter(produto => {
      // Filtro por busca
      if (filtroParetoQuantidade.busca) {
        const busca = filtroParetoQuantidade.busca.toLowerCase();
        const matchCodigo = produto.codigo.toLowerCase().includes(busca);
        const matchDescricao = produto.descricao.toLowerCase().includes(busca);
        if (!matchCodigo && !matchDescricao) return false;
      }

      // Filtro por Pareto
      if (filtroParetoQuantidade.pareto) {
        if (filtroParetoQuantidade.pareto === 'sim' && !produto.isPareto) return false;
        if (filtroParetoQuantidade.pareto === 'nao' && produto.isPareto) return false;
      }

      // Filtro por quantidade
      if (filtroParetoQuantidade.quantidadeMin && produto.quantidade < parseFloat(filtroParetoQuantidade.quantidadeMin)) {
        return false;
      }
      if (filtroParetoQuantidade.quantidadeMax && produto.quantidade > parseFloat(filtroParetoQuantidade.quantidadeMax)) {
        return false;
      }

      // Filtro por valor
      if (filtroParetoQuantidade.valorMin && produto.valor < parseFloat(filtroParetoQuantidade.valorMin)) {
        return false;
      }
      if (filtroParetoQuantidade.valorMax && produto.valor > parseFloat(filtroParetoQuantidade.valorMax)) {
        return false;
      }

      // Filtro por percentual
      if (filtroParetoQuantidade.percentualMin && produto.percentual < parseFloat(filtroParetoQuantidade.percentualMin)) {
        return false;
      }
      if (filtroParetoQuantidade.percentualMax && produto.percentual > parseFloat(filtroParetoQuantidade.percentualMax)) {
        return false;
      }

      return true;
    });

    // Aplicar ordenação
    dadosFiltrados.sort((a, b) => {
      let aValue = a[ordenacaoParetoQuantidade.campo];
      let bValue = b[ordenacaoParetoQuantidade.campo];

      // Tratamento especial para campos numéricos
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (ordenacaoParetoQuantidade.direcao === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      // Tratamento para strings
      aValue = aValue?.toString().toLowerCase() || '';
      bValue = bValue?.toString().toLowerCase() || '';

      if (ordenacaoParetoQuantidade.direcao === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return dadosFiltrados;
  };

  const handleOrdenacaoParetoQuantidade = (campo: string) => {
    if (ordenacaoParetoQuantidade.campo === campo) {
      setOrdenacaoParetoQuantidade(prev => ({
        ...prev,
        direcao: prev.direcao === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setOrdenacaoParetoQuantidade({
        campo,
        direcao: 'asc'
      });
    }
  };

  const limparFiltrosParetoQuantidade = () => {
    setFiltroParetoQuantidade({
      busca: '',
      pareto: '',
      quantidadeMin: '',
      quantidadeMax: '',
      valorMin: '',
      valorMax: '',
      percentualMin: '',
      percentualMax: ''
    });
  };

  const getIconeOrdenacaoParetoQuantidade = (campo: string) => {
    if (ordenacaoParetoQuantidade.campo !== campo) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return ordenacaoParetoQuantidade.direcao === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  // Funções para seleção múltipla
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const allIds = getPaginatedData().map(item => item.id);
      setSelectedItems(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        const newSelected = prev.filter(itemId => itemId !== id);
        setSelectAll(false);
        return newSelected;
      } else {
        const newSelected = [...prev, id];
        const allIds = getPaginatedData().map(item => item.id);
        setSelectAll(newSelected.length === allIds.length);
        return newSelected;
      }
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error("Selecione pelo menos uma nota fiscal para remover");
      return;
    }

    if (confirm(`Tem certeza que deseja remover ${selectedItems.length} nota(s) fiscal(is)?`)) {
      try {
        for (const id of selectedItems) {
          await handleDeleteNotaFiscal(id);
        }
        
        toast.success(`${selectedItems.length} nota(s) fiscal(is) removida(s) com sucesso`);
        setSelectedItems([]);
        setSelectAll(false);
        loadNotasFiscais();
      } catch (error) {
        console.error("Erro ao remover notas fiscais:", error);
        toast.error("Erro ao remover notas fiscais selecionadas");
      }
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nota Fiscal</h1>
          <p className="text-muted-foreground">Gestão de documentos fiscais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? "Importando..." : "Importar XML"}
          </Button>
          <Button className="bg-gradient-primary text-primary-foreground" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Emitir NF
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteAllDialogOpen(true)}
            disabled={notasFiscais.length === 0 || loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remover Todas
          </Button>
        </div>
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".xml,.zip"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Progresso da Importação */}
      {isImporting && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FileArchive className="mr-2 h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Importando arquivos...</span>
              </div>
              <span className="text-sm text-blue-700">{Math.round(importProgress)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            {importedCount > 0 && (
              <p className="text-sm text-blue-700 mt-2">
                {importedCount} nota(s) fiscal(is) processada(s)
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Erros de Importação */}
      {importErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 text-sm">Erros na Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {importErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}



      {/* Abas de Conteúdo */}
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Lista de Notas Fiscais</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Aba: Lista de Notas Fiscais */}
        <TabsContent value="lista" className="space-y-4">
          {/* Cards de Estatísticas */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  NFs Este Mês
                  {useFilteredStats && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {useFilteredStats ? calculateFilteredStats().nfsEsteMes : stats.nfsEsteMes}
                </div>
                {(() => {
                  const currentStats = useFilteredStats ? calculateFilteredStats() : stats;
                  return (
                    <>
                      {currentStats.nfsMesAnterior > 0 && (
                        <p className={`text-xs ${formatVariation(calculateVariation(currentStats.nfsEsteMes, currentStats.nfsMesAnterior)).color}`}>
                          {formatVariation(calculateVariation(currentStats.nfsEsteMes, currentStats.nfsMesAnterior)).text} vs mês anterior
                        </p>
                      )}
                      {currentStats.nfsMesAnterior === 0 && currentStats.nfsEsteMes > 0 && (
                        <p className="text-xs text-green-600">+100% vs mês anterior</p>
                      )}
                      {currentStats.nfsMesAnterior === 0 && currentStats.nfsEsteMes === 0 && (
                        <p className="text-xs text-muted-foreground">Nenhuma NF este mês</p>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Valor Total
                  {useFilteredStats && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                </CardTitle>
                <FileText className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  R$ {(useFilteredStats ? calculateFilteredStats().valorTotal : stats.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {(() => {
                  const currentStats = useFilteredStats ? calculateFilteredStats() : stats;
                  return (
                    <>
                      {currentStats.valorMesAnterior > 0 && (
                        <p className={`text-xs ${formatVariation(calculateVariation(currentStats.valorTotal, currentStats.valorMesAnterior)).color}`}>
                          {formatVariation(calculateVariation(currentStats.valorTotal, currentStats.valorMesAnterior)).text} vs mês anterior
                        </p>
                      )}
                      {currentStats.valorMesAnterior === 0 && currentStats.valorTotal > 0 && (
                        <p className="text-xs text-green-600">+100% vs mês anterior</p>
                      )}
                      {currentStats.valorMesAnterior === 0 && currentStats.valorTotal === 0 && (
                        <p className="text-xs text-muted-foreground">Nenhum valor este mês</p>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pendentes
                  {useFilteredStats && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                </CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {useFilteredStats ? calculateFilteredStats().pendentes : stats.pendentes}
                </div>
                <p className="text-xs text-muted-foreground">Aguardando emissão</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Emitidas
                  {useFilteredStats && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {useFilteredStats ? calculateFilteredStats().emitidas : stats.emitidas}
                </div>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Notas Fiscais */}
          <Card>
            <CardHeader>
              <CardTitle>Controle de Notas Fiscais</CardTitle>
              <CardDescription>Histórico e status de emissão</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notas fiscais..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="items-per-page" className="text-sm">Itens por página:</Label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant={hasActiveFilters() ? "default" : "outline"}
              onClick={() => setIsFilterDialogOpen(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros {hasActiveFilters() && <Badge variant="secondary" className="ml-2">Ativo</Badge>}
            </Button>
            {selectedItems.length > 0 && (
              <Button 
                variant="destructive"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover ({selectedItems.length})
              </Button>
            )}
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Relatório
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-4 w-4 p-0"
                    >
                      {selectAll ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('numero')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Número</span>
                      {getSortIcon('numero')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('destinatario_nome')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Cliente</span>
                      {getSortIcon('destinatario_nome')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('data_emissao')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Data</span>
                      {getSortIcon('data_emissao')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('valor_total')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Valor</span>
                      {getSortIcon('valor_total')}
                    </div>
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Chave de Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Carregando notas fiscais...
                    </TableCell>
                  </TableRow>
                ) : notasFiscais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhuma nota fiscal encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  getPaginatedData().map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectItem(item.id)}
                          className="h-4 w-4 p-0"
                        >
                          {selectedItems.includes(item.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{item.numero}</TableCell>
                      <TableCell>{item.destinatario_nome}</TableCell>
                      <TableCell>{new Date(item.data_emissao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>R$ {item.valor_total.toLocaleString()}</TableCell>
                      <TableCell>{item.tipo === 'entrada' ? 'Entrada' : 'Saída'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.xml_filename || '-'}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewNotaFiscal(item.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => confirmDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {!loading && notasFiscais.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, applyFilters(notasFiscais).length)} de {applyFilters(notasFiscais).length} notas fiscais
                {hasActiveFilters() && (
                  <span className="ml-2 text-blue-600">
                    (filtrado de {notasFiscais.length} total)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {getTotalPages()}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === getTotalPages()}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Aba: Relatórios */}
        <TabsContent value="relatorios" className="space-y-4">
          {/* Filtros Globais para Relatórios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Filtros para Relatórios
                {hasActiveFiltersRelatorio() && (
                  <Badge variant="secondary" className="ml-2">Filtros Ativos</Badge>
                )}
              </CardTitle>
              <CardDescription>Configure os filtros para refinar todos os relatórios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="filtro-categoria">Categoria Principal</Label>
                  <Select value={filtrosRelatorio.categoria} onValueChange={(value) => setFiltrosRelatorio({...filtrosRelatorio, categoria: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categories.filter(cat => !cat.parent_id).map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-subcategoria">Subcategoria</Label>
                  <Select value={filtrosRelatorio.subcategoria} onValueChange={(value) => setFiltrosRelatorio({...filtrosRelatorio, subcategoria: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as subcategorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as subcategorias</SelectItem>
                      {categories.filter(cat => cat.parent_id).map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-cliente">Cliente</Label>
                  <Input
                    placeholder="Digite o nome do cliente"
                    value={filtrosRelatorio.cliente}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, cliente: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-status">Status</Label>
                  <Select value={filtrosRelatorio.status} onValueChange={(value) => setFiltrosRelatorio({...filtrosRelatorio, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="emitida">Emitida</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-valor-min">Valor Mínimo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={filtrosRelatorio.valorMin}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, valorMin: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-valor-max">Valor Máximo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={filtrosRelatorio.valorMax}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, valorMax: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-data-inicio">Data Início</Label>
                  <Input
                    type="date"
                    value={filtrosRelatorio.dataInicio}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, dataInicio: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-data-fim">Data Fim</Label>
                  <Input
                    type="date"
                    value={filtrosRelatorio.dataFim}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, dataFim: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={limparFiltrosRelatorio}>
                    Limpar Filtros
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const dadosFiltrados = aplicarFiltrosRelatorio(filtrarPorPeriodo(notasFiscais, periodoRelatorio));
                      return `${dadosFiltrados.length} notas fiscais encontradas`;
                    })()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={periodoRelatorio} onValueChange={setPeriodoRelatorio}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ultima_semana">Última Semana</SelectItem>
                      <SelectItem value="ultimo_mes">Último Mês</SelectItem>
                      <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
                      <SelectItem value="ultimo_ano">Último Ano</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controles de Relatório */}
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Notas Fiscais</CardTitle>
              <CardDescription>Análises gráficas e insights de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-muted-foreground">
                  Todos os relatórios abaixo refletem os filtros aplicados acima
                </div>
              </div>

              {/* Cards de Resumo */}
              <div className="grid gap-6 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Notas
                      {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const dadosFiltrados = aplicarFiltrosRelatorio(filtrarPorPeriodo(notasFiscais, periodoRelatorio));
                        return dadosFiltrados.length;
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">Período selecionado</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Valor Total
                      {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      R$ {(() => {
                        const dadosFiltrados = aplicarFiltrosRelatorio(filtrarPorPeriodo(notasFiscais, periodoRelatorio));
                        return dadosFiltrados.reduce((sum, nota) => sum + parseFloat(nota.valor_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">Faturamento total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Ticket Médio
                      {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      R$ {(() => {
                        const dadosFiltrados = aplicarFiltrosRelatorio(filtrarPorPeriodo(notasFiscais, periodoRelatorio));
                        return dadosFiltrados.length > 0 ? (dadosFiltrados.reduce((sum, nota) => sum + parseFloat(nota.valor_total || 0), 0) / dadosFiltrados.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00';
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">Por nota fiscal</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Regiões Atendidas
                      {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                    </CardTitle>
                    <MapPin className="h-4 w-4 text-warning" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">
                      {(() => {
                        const dadosFiltrados = aplicarFiltrosRelatorio(filtrarPorPeriodo(notasFiscais, periodoRelatorio));
                        return new Set(dadosFiltrados.map(nota => nota.destinatario_endereco?.estado).filter(Boolean)).size;
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">Estados diferentes</p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos */}
                              <Tabs defaultValue="produtos" className="space-y-4">
                                                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
                  <TabsTrigger value="produtos">Por Produtos</TabsTrigger>
                  <TabsTrigger value="produtos_qtd">Por Qtd. Produtos</TabsTrigger>
                                              <TabsTrigger value="rentabilidade">Curva ABC</TabsTrigger>
                  <TabsTrigger value="temporal">Evolução Temporal</TabsTrigger>
                  <TabsTrigger value="valor">Por Valor</TabsTrigger>
                </TabsList>



                {/* Relatório por Produtos */}
                <TabsContent value="produtos" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Faturamento por Produto
                        {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                      </CardTitle>
                      <CardDescription>Top produtos por valor faturado (reflete os filtros aplicados)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dadosProdutos.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                          <p className="text-muted-foreground">Nenhum dado de produto disponível</p>
                        </div>
                      ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={dadosProdutos}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="descricao" 
                            tickFormatter={(value) => {
                              if (!value) return 'Sem descrição';
                              return value.length > 30 ? value.substring(0, 30) + '...' : value;
                            }}
                            angle={-30}
                            textAnchor="end"
                            height={90}
                            interval={0}
                            tick={{ fontSize: 11 }}
                            dy={10}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                            labelFormatter={(label) => {
                              const produto = dadosProdutos.find(p => p.descricao === label);
                              return produto ? produto.descricao : label;
                            }}
                          />
                          <Legend />
                          <Bar dataKey="valor" fill="#00C49F" name="Valor Faturado" />
                        </BarChart>
                      </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tabela detalhada de Pareto */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalhamento por Produto (Pareto 80/20)</CardTitle>
                      <CardDescription>Análise dos produtos que representam 80% do faturamento</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Filtros */}
                      <div className="mb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Busca */}
                          <div className="space-y-2">
                            <Label htmlFor="busca-pareto">Buscar</Label>
                            <Input
                              id="busca-pareto"
                              placeholder="Código ou descrição..."
                              value={filtroPareto.busca}
                              onChange={(e) => setFiltroPareto(prev => ({ ...prev, busca: e.target.value }))}
                            />
                          </div>

                          {/* Pareto */}
                          <div className="space-y-2">
                            <Label htmlFor="pareto-filter">Pareto</Label>
                            <Select value={filtroPareto.pareto} onValueChange={(value) => setFiltroPareto(prev => ({ ...prev, pareto: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Todos</SelectItem>
                                <SelectItem value="sim">Produtos Pareto (80%)</SelectItem>
                                <SelectItem value="nao">Produtos não Pareto (20%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Faixa de Quantidade */}
                          <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Mín"
                                type="number"
                                value={filtroPareto.quantidadeMin}
                                onChange={(e) => setFiltroPareto(prev => ({ ...prev, quantidadeMin: e.target.value }))}
                              />
                              <Input
                                placeholder="Máx"
                                type="number"
                                value={filtroPareto.quantidadeMax}
                                onChange={(e) => setFiltroPareto(prev => ({ ...prev, quantidadeMax: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* Faixa de Valor */}
                          <div className="space-y-2">
                            <Label>Valor Total (R$)</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Mín"
                                type="number"
                                step="0.01"
                                value={filtroPareto.valorMin}
                                onChange={(e) => setFiltroPareto(prev => ({ ...prev, valorMin: e.target.value }))}
                              />
                              <Input
                                placeholder="Máx"
                                type="number"
                                step="0.01"
                                value={filtroPareto.valorMax}
                                onChange={(e) => setFiltroPareto(prev => ({ ...prev, valorMax: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Filtros adicionais */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Faixa de Percentual */}
                          <div className="space-y-2">
                            <Label>% Faturamento</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Mín %"
                                type="number"
                                step="0.01"
                                value={filtroPareto.percentualMin}
                                onChange={(e) => setFiltroPareto(prev => ({ ...prev, percentualMin: e.target.value }))}
                              />
                              <Input
                                placeholder="Máx %"
                                type="number"
                                step="0.01"
                                value={filtroPareto.percentualMax}
                                onChange={(e) => setFiltroPareto(prev => ({ ...prev, percentualMax: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* Estatísticas */}
                          <div className="space-y-2">
                            <Label>Resultados</Label>
                            <div className="text-sm text-muted-foreground">
                              {(() => {
                                const dadosProcessados = processarDadosPareto();
                                const total = dadosProdutos.length;
                                const filtrados = dadosProcessados.length;
                                return `${filtrados} de ${total} produtos`;
                              })()}
                            </div>
                          </div>

                          {/* Botão Limpar */}
                          <div className="space-y-2">
                            <Label>&nbsp;</Label>
                            <Button 
                              variant="outline" 
                              onClick={limparFiltrosPareto}
                              className="w-full"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Limpar Filtros
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleOrdenacaoPareto('codigo')}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Código</span>
                                  {getIconeOrdenacaoPareto('codigo')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleOrdenacaoPareto('descricao')}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Descrição</span>
                                  {getIconeOrdenacaoPareto('descricao')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoPareto('quantidade')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>Qtd. Total</span>
                                  {getIconeOrdenacaoPareto('quantidade')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoPareto('valor_unitario_medio')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>Valor Unit. Médio</span>
                                  {getIconeOrdenacaoPareto('valor_unitario_medio')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoPareto('valor')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>Valor Total</span>
                                  {getIconeOrdenacaoPareto('valor')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoPareto('percentual')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>% do Faturamento</span>
                                  {getIconeOrdenacaoPareto('percentual')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-center"
                                onClick={() => handleOrdenacaoPareto('isPareto')}
                              >
                                <div className="flex items-center justify-center space-x-1">
                                  <span>Pareto</span>
                                  {getIconeOrdenacaoPareto('isPareto')}
                                </div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const dadosProcessados = processarDadosPareto();
                              
                              if (dadosProcessados.length === 0) {
                                return (
                                  <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                      Nenhum produto encontrado com os filtros aplicados
                                    </TableCell>
                                  </TableRow>
                                );
                              }

                              return dadosProcessados.map((p) => {
                                // Limitar descrição a 150 caracteres
                                const descricaoLimitada = p.descricao && p.descricao.length > 150 
                                  ? p.descricao.substring(0, 150) + '...' 
                                  : p.descricao;
                                
                                return (
                                  <TableRow key={p.codigo} className={p.isPareto ? 'bg-green-50 font-semibold' : ''}>
                                    <TableCell className="font-medium">{p.codigo}</TableCell>
                                    <TableCell>
                                      <div 
                                        className="max-w-xs truncate"
                                        title={p.descricao && p.descricao.length > 150 ? p.descricao : undefined}
                                      >
                                        {descricaoLimitada || 'Sem descrição'}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">{p.quantidade.toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="text-right">R$ {p.valor_unitario_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right">{p.percentual.toFixed(2)}%</TableCell>
                                    <TableCell className="text-center">
                                      {p.isPareto ? (
                                        <Badge variant="default" className="bg-green-600">Sim</Badge>
                                      ) : (
                                        <Badge variant="secondary">Não</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              });
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Relatório por Quantidade de Produtos */}
                <TabsContent value="produtos_qtd" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quantidade por Produto</CardTitle>
                      <CardDescription>Top produtos por quantidade vendida</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dadosProdutos.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                          <p className="text-muted-foreground">Nenhum dado de produto disponível</p>
                        </div>
                      ) : (
                      <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={dadosProdutos}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="descricao" 
                            tickFormatter={(value) => {
                              if (!value) return 'Sem descrição';
                              return value.length > 30 ? value.substring(0, 30) + '...' : value;
                            }}
                            angle={-30}
                            textAnchor="end"
                            height={90}
                            interval={0}
                            tick={{ fontSize: 11 }}
                            dy={10}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => `${value.toLocaleString('pt-BR')} unidades`}
                            labelFormatter={(label) => {
                              const produto = dadosProdutos.find(p => p.descricao === label);
                              return produto ? produto.descricao : label;
                            }}
                          />
                          <Legend />
                          <Bar dataKey="quantidade" fill="#FF6B6B" name="Quantidade Vendida" />
                        </BarChart>
                      </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tabela detalhada de Pareto por quantidade */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalhamento por Quantidade (Pareto 80/20)</CardTitle>
                      <CardDescription>Análise dos produtos que representam 80% da quantidade vendida</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Filtros */}
                      <div className="mb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Busca */}
                          <div className="space-y-2">
                            <Label htmlFor="busca-pareto-qtd">Buscar</Label>
                            <Input
                              id="busca-pareto-qtd"
                              placeholder="Código ou descrição..."
                              value={filtroParetoQuantidade.busca}
                              onChange={(e) => setFiltroParetoQuantidade(prev => ({ ...prev, busca: e.target.value }))}
                            />
                          </div>

                          {/* Pareto */}
                          <div className="space-y-2">
                            <Label htmlFor="pareto-qtd-filter">Pareto</Label>
                            <Select value={filtroParetoQuantidade.pareto} onValueChange={(value) => setFiltroParetoQuantidade(prev => ({ ...prev, pareto: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Todos</SelectItem>
                                <SelectItem value="sim">Produtos Pareto (80%)</SelectItem>
                                <SelectItem value="nao">Produtos não Pareto (20%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Faixa de Quantidade */}
                          <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Mín"
                                type="number"
                                value={filtroParetoQuantidade.quantidadeMin}
                                onChange={(e) => setFiltroParetoQuantidade(prev => ({ ...prev, quantidadeMin: e.target.value }))}
                              />
                              <Input
                                placeholder="Máx"
                                type="number"
                                value={filtroParetoQuantidade.quantidadeMax}
                                onChange={(e) => setFiltroParetoQuantidade(prev => ({ ...prev, quantidadeMax: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* Faixa de Valor */}
                          <div className="space-y-2">
                            <Label>Valor Total (R$)</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Mín"
                                type="number"
                                step="0.01"
                                value={filtroParetoQuantidade.valorMin}
                                onChange={(e) => setFiltroParetoQuantidade(prev => ({ ...prev, valorMin: e.target.value }))}
                              />
                              <Input
                                placeholder="Máx"
                                type="number"
                                step="0.01"
                                value={filtroParetoQuantidade.valorMax}
                                onChange={(e) => setFiltroParetoQuantidade(prev => ({ ...prev, valorMax: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Filtros adicionais */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Faixa de Percentual */}
                          <div className="space-y-2">
                            <Label>% Quantidade</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Mín %"
                                type="number"
                                step="0.01"
                                value={filtroParetoQuantidade.percentualMin}
                                onChange={(e) => setFiltroParetoQuantidade(prev => ({ ...prev, percentualMin: e.target.value }))}
                              />
                              <Input
                                placeholder="Máx %"
                                type="number"
                                step="0.01"
                                value={filtroParetoQuantidade.percentualMax}
                                onChange={(e) => setFiltroParetoQuantidade(prev => ({ ...prev, percentualMax: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* Estatísticas */}
                          <div className="space-y-2">
                            <Label>Resultados</Label>
                            <div className="text-sm text-muted-foreground">
                              {(() => {
                                const dadosProcessados = processarDadosParetoQuantidade();
                                const total = dadosProdutos.length;
                                const filtrados = dadosProcessados.length;
                                return `${filtrados} de ${total} produtos`;
                              })()}
                            </div>
                          </div>

                          {/* Botão Limpar */}
                          <div className="space-y-2">
                            <Label>&nbsp;</Label>
                            <Button 
                              variant="outline" 
                              onClick={limparFiltrosParetoQuantidade}
                              className="w-full"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Limpar Filtros
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleOrdenacaoParetoQuantidade('codigo')}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Código</span>
                                  {getIconeOrdenacaoParetoQuantidade('codigo')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleOrdenacaoParetoQuantidade('descricao')}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Descrição</span>
                                  {getIconeOrdenacaoParetoQuantidade('descricao')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoParetoQuantidade('quantidade')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>Qtd. Total</span>
                                  {getIconeOrdenacaoParetoQuantidade('quantidade')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoParetoQuantidade('valor_unitario_medio')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>Valor Unit. Médio</span>
                                  {getIconeOrdenacaoParetoQuantidade('valor_unitario_medio')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoParetoQuantidade('valor')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>Valor Total</span>
                                  {getIconeOrdenacaoParetoQuantidade('valor')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoParetoQuantidade('percentual')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>% da Quantidade</span>
                                  {getIconeOrdenacaoParetoQuantidade('percentual')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-center"
                                onClick={() => handleOrdenacaoParetoQuantidade('isPareto')}
                              >
                                <div className="flex items-center justify-center space-x-1">
                                  <span>Pareto</span>
                                  {getIconeOrdenacaoParetoQuantidade('isPareto')}
                                </div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const dadosProcessados = processarDadosParetoQuantidade();
                              
                              if (dadosProcessados.length === 0) {
                                return (
                                  <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                      Nenhum produto encontrado com os filtros aplicados
                                    </TableCell>
                                  </TableRow>
                                );
                              }

                              return dadosProcessados.map((p) => {
                                // Limitar descrição a 150 caracteres
                                const descricaoLimitada = p.descricao && p.descricao.length > 150 
                                  ? p.descricao.substring(0, 150) + '...' 
                                  : p.descricao;
                                
                                return (
                                  <TableRow key={p.codigo} className={p.isPareto ? 'bg-blue-50 font-semibold' : ''}>
                                    <TableCell className="font-medium">{p.codigo}</TableCell>
                                    <TableCell>
                                      <div 
                                        className="max-w-xs truncate"
                                        title={p.descricao && p.descricao.length > 150 ? p.descricao : undefined}
                                      >
                                        {descricaoLimitada || 'Sem descrição'}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">{p.quantidade.toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="text-right">R$ {p.valor_unitario_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right">{p.percentual.toFixed(2)}%</TableCell>
                                    <TableCell className="text-center">
                                      {p.isPareto ? (
                                        <Badge variant="default" className="bg-blue-600">Sim</Badge>
                                      ) : (
                                        <Badge variant="secondary">Não</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              });
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de pizza por quantidade */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Quantidade</CardTitle>
                      <CardDescription>Proporção de quantidade vendida por produto</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <RechartsPieChart>
                          <Pie
                            data={dadosProdutos.slice(0, 10)} // Top 10 produtos
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ descricao, percent }) => {
                              const nomeCurto = descricao && descricao.length > 20 
                                ? descricao.substring(0, 20) + '...' 
                                : descricao || 'Sem descrição';
                              return `${nomeCurto} ${(percent * 100).toFixed(0)}%`;
                            }}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="quantidade"
                          >
                            {dadosProdutos.slice(0, 10).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 36}, 70%, 60%)`} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => `${value.toLocaleString('pt-BR')} unidades`}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Relatório de Rentabilidade */}
                <TabsContent value="rentabilidade" className="space-y-4">
                  {/* Análise Curva ABC */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Análise Curva ABC</CardTitle>
                      <CardDescription>Classificação dos produtos por importância no faturamento total</CardDescription>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-600 text-white font-bold">A</Badge>
                          <span>80% do faturamento - Produtos mais importantes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-yellow-600 text-white font-bold">B</Badge>
                          <span>15% do faturamento - Produtos de importância média</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="bg-red-600 text-white">C</Badge>
                          <span>5% do faturamento - Produtos menos importantes</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {dadosProdutos.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                          <p className="text-muted-foreground">Nenhum dado de produto disponível</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={dadosProdutos.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="descricao" 
                              tickFormatter={(value) => {
                                if (!value) return 'Sem descrição';
                                return value.length > 25 ? value.substring(0, 25) + '...' : value;
                              }}
                              angle={-30}
                              textAnchor="end"
                              height={90}
                              interval={0}
                              tick={{ fontSize: 10 }}
                              dy={10}
                            />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip 
                              formatter={(value, name) => {
                                if (name === 'quantidade') return [`${value.toLocaleString('pt-BR')} unidades`, 'Quantidade'];
                                if (name === 'valor') return [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento'];
                                return [value, name];
                              }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="quantidade" fill="#FF6B6B" name="Quantidade" />
                            <Bar yAxisId="right" dataKey="valor" fill="#4ECDC4" name="Faturamento" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tabela de Análise Curva ABC */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Análise Detalhada - Curva ABC</CardTitle>
                      <CardDescription>Classificação dos produtos por importância no faturamento total</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Filtros */}
                      <div className="mb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Busca */}
                          <div className="space-y-2">
                            <Label htmlFor="busca-rentabilidade">Buscar</Label>
                            <Input
                              id="busca-rentabilidade"
                              placeholder="Código ou descrição..."
                              value={filtroRentabilidade.busca}
                              onChange={(e) => setFiltroRentabilidade(prev => ({ ...prev, busca: e.target.value }))}
                            />
                          </div>



                          {/* Curva ABC */}
                          <div className="space-y-2">
                            <Label htmlFor="curva-abc-rentabilidade">Curva ABC</Label>
                            <Select value={filtroRentabilidade.categoria} onValueChange={(value) => setFiltroRentabilidade(prev => ({ ...prev, categoria: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Todas as curvas" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Todas as curvas</SelectItem>
                                <SelectItem value="A">Curva A - Produtos Premium (80%)</SelectItem>
                                <SelectItem value="B">Curva B - Produtos Estrela (15%)</SelectItem>
                                <SelectItem value="C">Curva C - Produtos Volume (5%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Faixa de Rentabilidade */}
                          <div className="space-y-2">
                            <Label>Rentabilidade (R$)</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Mín"
                                type="number"
                                step="0.01"
                                value={filtroRentabilidade.rentabilidadeMin}
                                onChange={(e) => setFiltroRentabilidade(prev => ({ ...prev, rentabilidadeMin: e.target.value }))}
                              />
                              <Input
                                placeholder="Máx"
                                type="number"
                                step="0.01"
                                value={filtroRentabilidade.rentabilidadeMax}
                                onChange={(e) => setFiltroRentabilidade(prev => ({ ...prev, rentabilidadeMax: e.target.value }))}
                              />
                            </div>
                          </div>

                        </div>

                        {/* Filtros adicionais */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Botão Limpar */}
                          <div className="space-y-2">
                            <Label>&nbsp;</Label>
                            <Button 
                              variant="outline" 
                              onClick={limparFiltrosRentabilidade}
                              className="w-full"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Limpar Filtros
                            </Button>
                          </div>
                          {/* Faixa de Quantidade */}
                          <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Mín"
                                type="number"
                                step="0.01"
                                value={filtroRentabilidade.quantidadeMin}
                                onChange={(e) => setFiltroRentabilidade(prev => ({ ...prev, quantidadeMin: e.target.value }))}
                              />
                              <Input
                                placeholder="Máx"
                                type="number"
                                step="0.01"
                                value={filtroRentabilidade.quantidadeMax}
                                onChange={(e) => setFiltroRentabilidade(prev => ({ ...prev, quantidadeMax: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* Faixa de Valor */}
                          <div className="space-y-2">
                            <Label>Faturamento (R$)</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Mín"
                                type="number"
                                step="0.01"
                                value={filtroRentabilidade.valorMin}
                                onChange={(e) => setFiltroRentabilidade(prev => ({ ...prev, valorMin: e.target.value }))}
                              />
                              <Input
                                placeholder="Máx"
                                type="number"
                                step="0.01"
                                value={filtroRentabilidade.valorMax}
                                onChange={(e) => setFiltroRentabilidade(prev => ({ ...prev, valorMax: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* Faixa de Percentual */}
                          <div className="space-y-2">
                            <Label>% Faturamento</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Mín %"
                                type="number"
                                step="0.01"
                                value={filtroRentabilidade.percentualMin}
                                onChange={(e) => setFiltroRentabilidade(prev => ({ ...prev, percentualMin: e.target.value }))}
                              />
                              <Input
                                placeholder="Máx %"
                                type="number"
                                step="0.01"
                                value={filtroRentabilidade.percentualMax}
                                onChange={(e) => setFiltroRentabilidade(prev => ({ ...prev, percentualMax: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* Estatísticas */}
                          <div className="space-y-2">
                            <Label>Resultados</Label>
                            <div className="text-sm text-muted-foreground">
                              {(() => {
                                const dadosProcessados = processarDadosRentabilidade();
                                const total = dadosProdutos.length;
                                const filtrados = dadosProcessados.length;
                                return `${filtrados} de ${total} produtos`;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleOrdenacaoRentabilidade('codigo')}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Código</span>
                                  {getIconeOrdenacao('codigo')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleOrdenacaoRentabilidade('descricao')}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Descrição</span>
                                  {getIconeOrdenacao('descricao')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoRentabilidade('quantidade')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>Qtd. Vendida</span>
                                  {getIconeOrdenacao('quantidade')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoRentabilidade('valor_unitario_medio')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>Valor Unit. Médio</span>
                                  {getIconeOrdenacao('valor_unitario_medio')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoRentabilidade('valor')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>Faturamento</span>
                                  {getIconeOrdenacao('valor')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoRentabilidade('rentabilidade')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>Rentabilidade</span>
                                  {getIconeOrdenacao('rentabilidade')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-right"
                                onClick={() => handleOrdenacaoRentabilidade('percentual_faturamento')}
                              >
                                <div className="flex items-center justify-end space-x-1">
                                  <span>% Faturamento</span>
                                  {getIconeOrdenacao('percentual_faturamento')}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50 text-center"
                                onClick={() => handleOrdenacaoRentabilidade('categoria')}
                              >
                                <div className="flex items-center justify-center space-x-1">
                                  <span>Curva ABC</span>
                                  {getIconeOrdenacao('categoria')}
                                </div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const dadosProcessados = processarDadosRentabilidade();
                              
                                                             if (dadosProcessados.length === 0) {
                                 return (
                                   <TableRow>
                                     <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                       Nenhum produto encontrado com os filtros aplicados
                                     </TableCell>
                                   </TableRow>
                                 );
                               }

                              return dadosProcessados.map((produto) => {
                                // Limitar descrição a 100 caracteres
                                const descricaoLimitada = produto.descricao && produto.descricao.length > 100 
                                  ? produto.descricao.substring(0, 100) + '...' 
                                  : produto.descricao;
                                
                                return (
                                  <TableRow key={produto.codigo} className={getRowClassByCategoria(produto.categoria)}>
                                    <TableCell className="font-medium">{produto.codigo}</TableCell>
                                    <TableCell>
                                      <div 
                                        className="max-w-xs truncate"
                                        title={produto.descricao && produto.descricao.length > 100 ? produto.descricao : undefined}
                                      >
                                        {descricaoLimitada || 'Sem descrição'}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">{produto.quantidade.toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="text-right">R$ {produto.valor_unitario_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right">R$ {produto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right">R$ {produto.rentabilidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right">
                                      <span className={`font-medium ${produto.percentual_faturamento >= 10 ? 'text-green-600' : produto.percentual_faturamento >= 5 ? 'text-blue-600' : 'text-gray-600'}`}>
                                        {produto.percentual_faturamento.toFixed(2)}%
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge 
                                        variant={getBadgeVariantByCategoria(produto.categoria)}
                                        className={getBadgeClassByCategoria(produto.categoria)}
                                      >
                                        {produto.categoria}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              });
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Dispersão - Curva ABC */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Dispersão - Curva ABC</CardTitle>
                      <CardDescription>Quantidade vs Faturamento - Visualização da classificação ABC</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dadosProdutos.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                          <p className="text-muted-foreground">Nenhum dado de produto disponível</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={dadosProdutos.slice(0, 15)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="descricao" 
                              tickFormatter={(value) => {
                                if (!value) return 'Sem descrição';
                                return value.length > 20 ? value.substring(0, 20) + '...' : value;
                              }}
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              interval={0}
                              tick={{ fontSize: 9 }}
                              dy={10}
                            />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip 
                              formatter={(value, name) => {
                                if (name === 'quantidade') return [`${value.toLocaleString('pt-BR')} unidades`, 'Quantidade'];
                                if (name === 'valor') return [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento'];
                                return [value, name];
                              }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="quantidade" fill="#FF6B6B" name="Quantidade" />
                            <Bar yAxisId="right" dataKey="valor" fill="#4ECDC4" name="Faturamento" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Relatório Temporal */}
                <TabsContent value="temporal" className="space-y-4">

                  {/* Gráfico de Evolução Geral */}
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Evolução Temporal Geral
                        {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                      </CardTitle>
                      <CardDescription>Quantidade e valor ao longo do tempo (reflete os filtros aplicados)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={dadosTemporal}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Area yAxisId="left" type="monotone" dataKey="quantidade" stackId="1" stroke="#8884d8" fill="#8884d8" name="Quantidade" />
                          <Area yAxisId="right" type="monotone" dataKey="valor" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Valor" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Evolução por Categoria */}
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Evolução por Categoria
                        {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                      </CardTitle>
                      <CardDescription>Valor por categoria ao longo do tempo (reflete os filtros aplicados)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={dadosTemporalPorCategoria}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {(() => {
                            // Obter todas as categorias únicas dos dados
                            const categorias = new Set<string>();
                            dadosTemporalPorCategoria.forEach(item => {
                              Object.keys(item).forEach(key => {
                                if (key !== 'periodo') {
                                  categorias.add(key);
                                }
                              });
                            });
                            
                            const cores = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff', '#ffff00'];
                            
                            return Array.from(categorias).map((categoria, index) => (
                              <Line
                                key={categoria}
                                type="monotone"
                                dataKey={categoria}
                                stroke={cores[index % cores.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                name={categoria}
                              />
                            ));
                          })()}
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>



                {/* Relatório por Valor */}
                <TabsContent value="valor" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Distribuição por Faixa de Valor
                        {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                      </CardTitle>
                      <CardDescription>Quantidade de notas por faixa de valor (reflete os filtros aplicados)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={dadosValor}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="faixa" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="quantidade" fill="#FFBB28" name="Quantidade de Notas" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Tabela de Análise por Pareto - Valor */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Análise por Pareto - Faixas de Valor</CardTitle>
                      <CardDescription>Classificação das faixas de valor por importância no faturamento total</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Faixa de Valor</TableHead>
                              <TableHead className="text-right">Quantidade</TableHead>
                              <TableHead className="text-right">Valor Total</TableHead>
                              <TableHead className="text-right">% do Faturamento</TableHead>
                              <TableHead className="text-center">Pareto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              // Calcular Pareto por valor total das faixas
                              const totalValor = dadosValor.reduce((sum, faixa) => sum + faixa.valor_total, 0);
                              let acumulado = 0;
                              let atingiu80 = false;
                              
                              return dadosValor.map((faixa, idx) => {
                                const percentual = totalValor > 0 ? (faixa.valor_total / totalValor) * 100 : 0;
                                acumulado += percentual;
                                const isPareto = !atingiu80 && acumulado <= 80;
                                if (acumulado >= 80) atingiu80 = true;
                                
                                return (
                                  <TableRow key={faixa.faixa} className={isPareto ? 'bg-orange-50 font-semibold' : ''}>
                                    <TableCell className="font-medium">{faixa.faixa}</TableCell>
                                    <TableCell className="text-right">{faixa.quantidade.toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="text-right">R$ {faixa.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right">{percentual.toFixed(2)}%</TableCell>
                                    <TableCell className="text-center">
                                      {isPareto ? (
                                        <Badge variant="default" className="bg-orange-600">Sim</Badge>
                                      ) : (
                                        <Badge variant="secondary">Não</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              });
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Importação */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Notas Fiscais</DialogTitle>
            <DialogDescription>
              Selecione os arquivos XML ou ZIP e configure as opções de importação
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Seleção de Arquivos */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Arquivos</Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivos
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xml,.zip"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {selectedFiles && (
                <div className="text-sm text-muted-foreground">
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </div>
              )}
            </div>

            {/* Tipo de Nota Fiscal */}
            <div className="space-y-2">
              <Label htmlFor="import-type">Tipo de Nota Fiscal</Label>
              <Select value={importType} onValueChange={setImportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (Compra)</SelectItem>
                  <SelectItem value="saida">Saída (Venda)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Origem da Importação */}
            <div className="space-y-2">
              <Label htmlFor="import-origin">Origem</Label>
              <Select value={importOrigin} onValueChange={setImportOrigin}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Importação Manual</SelectItem>
                  <SelectItem value="sefaz">SEFAZ</SelectItem>
                  <SelectItem value="erp">Sistema ERP</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="api">API Externa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opção para lidar com duplicatas */}
            <div className="space-y-2">
              <Label htmlFor="handle-duplicates">Notas Fiscais Duplicadas</Label>
              <Select value={handleDuplicates} onValueChange={(value: 'skip' | 'overwrite') => setHandleDuplicates(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione como lidar com duplicatas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Pular (manter existente)</SelectItem>
                  <SelectItem value="overwrite">Sobrescrever (substituir existente)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {handleDuplicates === 'skip' 
                  ? 'Notas fiscais que já existem serão ignoradas'
                  : 'Notas fiscais existentes serão substituídas pelos novos dados'
                }
              </p>
            </div>

            {/* Opção para criar lançamento financeiro */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-financial-entry"
                  checked={shouldCreateFinancialEntry}
                  onCheckedChange={(checked) => setShouldCreateFinancialEntry(checked as boolean)}
                />
                <Label htmlFor="create-financial-entry" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Criar lançamento financeiro automaticamente
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Se marcado, criará uma conta a receber/pagar baseada na nota fiscal
              </p>
            </div>

            {/* Tipo de Lançamento Financeiro */}
            <div className="space-y-2">
              <Label htmlFor="import-financial-type">Tipo de Lançamento</Label>
              <Select value={importFinancialType} onValueChange={setImportFinancialType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="import-customer">Cliente</Label>
              <Select value={importCustomerId?.toString() || ''} onValueChange={(value) => setImportCustomerId(value ? parseInt(value) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Usar cliente da nota fiscal</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name} {customer.cpf ? `(${customer.cpf})` : customer.cnpj ? `(${customer.cnpj})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="import-category">Categoria</Label>
              <Select value={importCategoryId?.toString() || ''} onValueChange={(value) => setImportCategoryId(value ? parseInt(value) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status do Lançamento */}
            <div className="space-y-2">
              <Label htmlFor="import-status">Status do Lançamento</Label>
              <Select value={importStatus} onValueChange={setImportStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data de Vencimento */}
            <div className="space-y-2">
              <Label htmlFor="import-due-date">Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {importDueDate ? (
                      format(importDueDate, "PPP", { locale: ptBR })
                    ) : (
                      <span className="text-muted-foreground">Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={importDueDate}
                    onSelect={setImportDueDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Data de vencimento da conta a receber. Se não informada, será usada a data atual.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCancelImport}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmImport}
                disabled={!selectedFiles || isImporting}
              >
                {isImporting ? "Importando..." : "Importar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Filtros */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filtros de Notas Fiscais</DialogTitle>
            <DialogDescription>
              Configure os filtros para refinar sua busca
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Filtros Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="emitida">Emitida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="denegada">Denegada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-tipo">Tipo</Label>
                <Select value={filters.tipo} onValueChange={(value) => setFilters({...filters, tipo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-numero">Número da NF</Label>
                <Input
                  placeholder="Digite o número"
                  value={filters.numero}
                  onChange={(e) => setFilters({...filters, numero: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-cliente">Cliente</Label>
                <Input
                  placeholder="Digite o nome do cliente"
                  value={filters.cliente}
                  onChange={(e) => setFilters({...filters, cliente: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-chave-acesso">Chave de Acesso</Label>
                <Input
                  placeholder="Digite a chave de acesso"
                  value={filters.chaveAcesso}
                  onChange={(e) => setFilters({...filters, chaveAcesso: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-serie">Série</Label>
                <Input
                  placeholder="Digite a série"
                  value={filters.serie}
                  onChange={(e) => setFilters({...filters, serie: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-emitente">Emitente</Label>
                <Input
                  placeholder="Digite o nome do emitente"
                  value={filters.emitente}
                  onChange={(e) => setFilters({...filters, emitente: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-destinatario">Destinatário</Label>
                <Input
                  placeholder="Digite o nome do destinatário"
                  value={filters.destinatario}
                  onChange={(e) => setFilters({...filters, destinatario: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-origem">Origem</Label>
                <Select value={filters.origem} onValueChange={(value) => setFilters({...filters, origem: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as origens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as origens</SelectItem>
                    <SelectItem value="manual">Importação Manual</SelectItem>
                    <SelectItem value="sefaz">SEFAZ</SelectItem>
                    <SelectItem value="erp">Sistema ERP</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="api">API Externa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-categoria">Categoria</Label>
                <Select value={filters.categoria} onValueChange={(value) => setFilters({...filters, categoria: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros de Data */}
            <div className="space-y-4">
              <Label>Período de Emissão</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-data-inicio">Data Início</Label>
                  <Input
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => setFilters({...filters, dataInicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-data-fim">Data Fim</Label>
                  <Input
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => setFilters({...filters, dataFim: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Filtros de Valor */}
            <div className="space-y-4">
              <Label>Faixa de Valor</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-valor-min">Valor Mínimo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={filters.valorMin}
                    onChange={(e) => setFilters({...filters, valorMin: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-valor-max">Valor Máximo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={filters.valorMax}
                    onChange={(e) => setFilters({...filters, valorMax: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsFilterDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleApplyFilters}>
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação de Nota Fiscal */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Emitir Nota Fiscal</DialogTitle>
            <DialogDescription>
              Preencha as informações da nota fiscal
            </DialogDescription>
          </DialogHeader>
          
                    <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            setValidationErrors({});

            try {
              const formData = new FormData(e.currentTarget);
              const numero = formData.get('numero') as string;
              const serie = formData.get('serie') as string;
              const emitenteCnpj = formData.get('emitenteCnpj') as string;
              const emitenteNome = formData.get('emitenteNome') as string;

              // Validar se a nota fiscal já existe
              if (numero && serie && emitenteCnpj && emitenteNome) {
                const exists = await validateNotaFiscalExists(numero, serie, emitenteCnpj, emitenteNome);
                if (exists) {
                  setValidationErrors({
                    numero: `Já existe uma nota fiscal com o número ${numero} série ${serie} do emitente ${emitenteNome} (${emitenteCnpj})`
                  });
                  toast.error(`Já existe uma nota fiscal com o número ${numero} série ${serie} do emitente ${emitenteNome} (${emitenteCnpj})`);
                  setIsSubmitting(false);
                  return;
                }
              }

              const data = {
                numero: formData.get('numero') as string,
                serie: formData.get('serie') as string,
                tipo: formData.get('tipo') as string,
                natureza_operacao: formData.get('naturezaOp') as string,
                data_emissao: formData.get('dataEmissao') as string,
                emitente_nome: formData.get('emitenteNome') as string,
                emitente_cnpj: formData.get('emitenteCnpj') as string,
                destinatario_nome: formData.get('clienteNome') as string,
                destinatario_documento: formData.get('clienteDocumento') as string,
                destinatario_email: formData.get('clienteEmail') as string,
                destinatario_telefone: formData.get('clienteTelefone') as string,
                destinatario_endereco: {
                  logradouro: formData.get('clienteLogradouro') as string,
                  numero: formData.get('clienteNumero') as string,
                  bairro: formData.get('clienteBairro') as string,
                  cidade: formData.get('clienteCidade') as string,
                  estado: formData.get('clienteEstado') as string,
                  cep: formData.get('clienteCep') as string,
                },
                valor_total: parseFloat(formData.get('valorPagamento') as string),
                forma_pagamento: formData.get('formaPagamento') as string,
                observacoes: formData.get('observacoes') as string,
                produtos: [
                  {
                    codigo: formData.get('produtoCodigo') as string,
                    descricao: formData.get('produtoDescricao') as string,
                    ncm: formData.get('produtoNcm') as string,
                    cfop: formData.get('produtoCfop') as string,
                    unidade: formData.get('produtoUnidade') as string,
                    quantidade: parseFloat(formData.get('produtoQuantidade') as string),
                    valor_unitario: parseFloat(formData.get('produtoValorUnitario') as string),
                    valor_total: parseFloat(formData.get('produtoValorTotal') as string),
                  }
                ],
              };
              
              // Salvar via API
              await notaFiscalAPI.createNotaFiscal(data);
              
              toast.success("Nota fiscal criada com sucesso!");
              setIsCreateDialogOpen(false);
              
              // Recarregar lista
              await loadNotasFiscais();
            } catch (error) {
              console.error("Erro ao criar nota fiscal:", error);
              toast.error("Erro ao criar nota fiscal");
            } finally {
              setIsSubmitting(false);
            }
          }} className="space-y-6">
            
            {/* Informações Básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número da NF</Label>
                <Input id="numero" name="numero" required placeholder="001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serie">Série</Label>
                <Input id="serie" name="serie" required placeholder="1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select name="tipo" defaultValue="saida">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataEmissao">Data de Emissão</Label>
                <Input id="dataEmissao" name="dataEmissao" type="date" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="naturezaOp">Natureza da Operação</Label>
              <Input id="naturezaOp" name="naturezaOp" required placeholder="Venda de mercadorias" />
            </div>

            {/* Emitente */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados do Emitente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emitenteNome">Nome/Razão Social</Label>
                  <Input id="emitenteNome" name="emitenteNome" required placeholder="Empresa Atual" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emitenteCnpj">CNPJ</Label>
                  <Input 
                    id="emitenteCnpj" 
                    name="emitenteCnpj" 
                    required 
                    placeholder="00.000.000/0001-00"
                    className={validationErrors.numero ? "border-red-500" : ""}
                  />
                  {validationErrors.numero && (
                    <p className="text-sm text-red-500">{validationErrors.numero}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados do Cliente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clienteNome">Nome/Razão Social</Label>
                  <Input id="clienteNome" name="clienteNome" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clienteDocumento">CPF/CNPJ</Label>
                  <Input id="clienteDocumento" name="clienteDocumento" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clienteEmail">Email</Label>
                  <Input id="clienteEmail" name="clienteEmail" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clienteTelefone">Telefone</Label>
                  <Input id="clienteTelefone" name="clienteTelefone" />
                </div>
              </div>
              
              {/* Endereço do Cliente */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clienteLogradouro">Logradouro</Label>
                  <Input id="clienteLogradouro" name="clienteLogradouro" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clienteNumero">Número</Label>
                  <Input id="clienteNumero" name="clienteNumero" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clienteBairro">Bairro</Label>
                  <Input id="clienteBairro" name="clienteBairro" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clienteCidade">Cidade</Label>
                  <Input id="clienteCidade" name="clienteCidade" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clienteEstado">Estado</Label>
                  <Input id="clienteEstado" name="clienteEstado" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clienteCep">CEP</Label>
                  <Input id="clienteCep" name="clienteCep" />
                </div>
              </div>
            </div>

            {/* Produtos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Produtos/Serviços</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="produtoCodigo">Código</Label>
                  <Input id="produtoCodigo" name="produtoCodigo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="produtoNcm">NCM</Label>
                  <Input id="produtoNcm" name="produtoNcm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="produtoDescricao">Descrição</Label>
                <Input id="produtoDescricao" name="produtoDescricao" required />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="produtoCfop">CFOP</Label>
                  <Input id="produtoCfop" name="produtoCfop" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="produtoUnidade">Unidade</Label>
                  <Input id="produtoUnidade" name="produtoUnidade" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="produtoQuantidade">Quantidade</Label>
                  <Input id="produtoQuantidade" name="produtoQuantidade" type="number" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="produtoValorUnitario">Valor Unitário</Label>
                  <Input id="produtoValorUnitario" name="produtoValorUnitario" type="number" step="0.01" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="produtoValorTotal">Valor Total</Label>
                <Input id="produtoValorTotal" name="produtoValorTotal" type="number" step="0.01" required />
              </div>
            </div>

            {/* Pagamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pagamento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                  <Select name="formaPagamento" defaultValue="dinheiro">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorPagamento">Valor Total</Label>
                  <Input id="valorPagamento" name="valorPagamento" type="number" step="0.01" required />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <textarea 
                id="observacoes" 
                name="observacoes" 
                className="w-full min-h-[100px] p-3 border border-input rounded-md resize-none"
                placeholder="Observações adicionais..."
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Emitir Nota Fiscal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização da Nota Fiscal */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
            <DialogDescription>
              Informações completas da nota fiscal
            </DialogDescription>
          </DialogHeader>
          
          {/* Botões de Download */}
          <div className="flex justify-end space-x-2 mb-4">
            <Button 
              variant="outline" 
              onClick={() => selectedNotaFiscal && handleDownloadPDF(selectedNotaFiscal.id)}
              disabled={isLoadingPdf}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={() => selectedNotaFiscal && handleDownloadXML(selectedNotaFiscal.id)}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar XML
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
            {/* Visualização em PDF */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b">
                <h3 className="font-medium">Visualização em PDF</h3>
              </div>
              <div className="h-full">
                {isLoadingPdf ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Carregando PDF...</p>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    title="PDF da Nota Fiscal"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">PDF não disponível</p>
                  </div>
                )}
              </div>
            </div>
            
                        {/* Detalhes da Nota Fiscal */}
            <div className="overflow-y-auto">
              {selectedNotaFiscal && (
                <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Número</Label>
                  <p className="text-sm text-muted-foreground">{selectedNotaFiscal.numero}</p>
                </div>
                <div>
                  <Label className="font-medium">Série</Label>
                  <p className="text-sm text-muted-foreground">{selectedNotaFiscal.serie}</p>
                </div>
                <div>
                  <Label className="font-medium">Tipo</Label>
                  <p className="text-sm text-muted-foreground">{selectedNotaFiscal.tipo === 'entrada' ? 'Entrada' : 'Saída'}</p>
                </div>
                <div>
                  <Label className="font-medium">Data de Emissão</Label>
                  <p className="text-sm text-muted-foreground">{new Date(selectedNotaFiscal.data_emissao).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedNotaFiscal.status)}</div>
                </div>
                <div>
                  <Label className="font-medium">Valor Total</Label>
                  <p className="text-sm text-muted-foreground">R$ {selectedNotaFiscal.valor_total.toLocaleString()}</p>
                </div>
              </div>

              {/* Emitente */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Emitente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Nome/Razão Social</Label>
                    <p className="text-sm text-muted-foreground">{selectedNotaFiscal.emitente_nome}</p>
                  </div>
                  <div>
                    <Label className="font-medium">CNPJ</Label>
                    <p className="text-sm text-muted-foreground">{selectedNotaFiscal.emitente_cnpj}</p>
                  </div>
                </div>
              </div>

              {/* Destinatário */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Destinatário</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Nome/Razão Social</Label>
                    <p className="text-sm text-muted-foreground">{selectedNotaFiscal.destinatario_nome}</p>
                  </div>
                  <div>
                    <Label className="font-medium">CPF/CNPJ</Label>
                    <p className="text-sm text-muted-foreground">{selectedNotaFiscal.destinatario_documento}</p>
                  </div>
                  {selectedNotaFiscal.destinatario_email && (
                    <div>
                      <Label className="font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{selectedNotaFiscal.destinatario_email}</p>
                    </div>
                  )}
                  {selectedNotaFiscal.destinatario_telefone && (
                    <div>
                      <Label className="font-medium">Telefone</Label>
                      <p className="text-sm text-muted-foreground">{selectedNotaFiscal.destinatario_telefone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Produtos */}
              {selectedNotaFiscal.produtos && selectedNotaFiscal.produtos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Produtos</h3>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>NCM</TableHead>
                          <TableHead>CFOP</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Valor Unit.</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedNotaFiscal.produtos.map((produto: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{produto.codigo}</TableCell>
                            <TableCell>{produto.descricao}</TableCell>
                            <TableCell>{produto.ncm || '-'}</TableCell>
                            <TableCell>{produto.cfop}</TableCell>
                            <TableCell>{produto.quantidade}</TableCell>
                            <TableCell>R$ {produto.valor_unitario.toLocaleString()}</TableCell>
                            <TableCell>R$ {produto.valor_total.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Valores */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Valores</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Valor dos Produtos</Label>
                    <p className="text-sm text-muted-foreground">R$ {selectedNotaFiscal.valor_produtos.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="font-medium">ICMS</Label>
                    <p className="text-sm text-muted-foreground">R$ {selectedNotaFiscal.valor_icms.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="font-medium">IPI</Label>
                    <p className="text-sm text-muted-foreground">R$ {selectedNotaFiscal.valor_ipi.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="font-medium">PIS</Label>
                    <p className="text-sm text-muted-foreground">R$ {selectedNotaFiscal.valor_pis.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="font-medium">COFINS</Label>
                    <p className="text-sm text-muted-foreground">R$ {selectedNotaFiscal.valor_cofins.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Frete</Label>
                    <p className="text-sm text-muted-foreground">R$ {selectedNotaFiscal.valor_frete.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedNotaFiscal.observacoes && (
                <div className="space-y-2">
                  <Label className="font-medium">Observações</Label>
                  <p className="text-sm text-muted-foreground">{selectedNotaFiscal.observacoes}</p>
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Remoção */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta nota fiscal? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingId && handleDeleteNotaFiscal(deletingId)}
              disabled={deletingId === null}
            >
              {deletingId ? "Removendo..." : "Remover"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Remoção de Todas as Notas Fiscais */}
      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Remoção em Massa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>TODAS as {notasFiscais.length} notas fiscais</strong>? 
              Esta ação não pode ser desfeita e removerá permanentemente todos os documentos fiscais.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700 font-medium">
                Atenção: Esta é uma ação irreversível!
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Todos os dados das notas fiscais serão perdidos permanentemente.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteAllDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAllNotasFiscais}
              disabled={loading}
            >
              {loading ? "Removendo..." : `Remover Todas (${notasFiscais.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 