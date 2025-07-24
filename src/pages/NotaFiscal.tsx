import { useState, useRef, useEffect } from "react";
import { Plus, Search, Filter, Download, Edit, Eye, Receipt, FileText, CheckCircle, Clock, Upload, FileArchive, Trash2, FileDown, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notaFiscalAPI } from "@/services/api";
import { toast } from "sonner";

export default function NotaFiscal() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<string>('saida');
  const [importOrigin, setImportOrigin] = useState<string>('manual');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notasFiscais, setNotasFiscais] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotaFiscal, setSelectedNotaFiscal] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  // Carregar notas fiscais
  useEffect(() => {
    loadNotasFiscais();
  }, []);

  const loadNotasFiscais = async () => {
    try {
      setLoading(true);
      const response = await notaFiscalAPI.getNotasFiscais();
      setNotasFiscais(response);
    } catch (error) {
      console.error("Erro ao carregar notas fiscais:", error);
      toast.error("Erro ao carregar notas fiscais");
    } finally {
      setLoading(false);
    }
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

  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const validateNotaFiscalExists = async (numero: string, emitenteCnpj: string) => {
    try {
      const result = await notaFiscalAPI.checkNotaFiscalExists(numero, emitenteCnpj);
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
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      
      // Verificar se é um XML válido
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("XML inválido");
      }

      // Extrair dados da NFe
      const nfe = xmlDoc.querySelector("NFe");
      if (!nfe) {
        throw new Error("NFe não encontrada no XML");
      }

      const ide = nfe.querySelector("ide");
      const emit = nfe.querySelector("emit");
      const dest = nfe.querySelector("dest");
      const total = nfe.querySelector("total");
      const protNFe = xmlDoc.querySelector("protNFe");

      if (!ide || !emit || !dest || !total) {
        throw new Error("Dados incompletos na NFe");
      }

      // Extrair informações básicas
      const numero = ide.querySelector("nNF")?.textContent || "";
      const serie = ide.querySelector("serie")?.textContent || "";
      const dataEmissao = ide.querySelector("dhEmi")?.textContent || "";
      const naturezaOp = ide.querySelector("natOp")?.textContent || "";
      
      // Emitente
      const cnpjEmit = emit.querySelector("CNPJ")?.textContent || "";
      const nomeEmit = emit.querySelector("xNome")?.textContent || "";
      
      // Destinatário
      const cpfDest = dest.querySelector("CPF")?.textContent || "";
      const cnpjDest = dest.querySelector("CNPJ")?.textContent || "";
      const nomeDest = dest.querySelector("xNome")?.textContent || "";
      
      // Valores
      const valorTotal = total.querySelector("vNF")?.textContent || "0";
      
      // Status da autorização
      const status = protNFe ? "Autorizada" : "Pendente";
      const protocolo = protNFe?.querySelector("nProt")?.textContent || "";
      const motivo = protNFe?.querySelector("xMotivo")?.textContent || "";
      
      // Chave de acesso
      const chave = xmlDoc.querySelector("chNFe")?.textContent || "";

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
      throw new Error(`Erro ao processar XML: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

    // Função para processar arquivo ZIP
  const processZipFile = async (file: File): Promise<any[]> => {
    try {
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      
      const zipContent = await zip.loadAsync(file);
      const promises: Promise<any>[] = [];
      
      zipContent.forEach((relativePath: string, zipEntry: any) => {
        if (zipEntry.name.endsWith('.xml')) {
          promises.push(
            zipEntry.async('string').then((content: string) => {
              try {
                return parseNFeXML(content);
              } catch (error) {
                console.error(`Erro ao processar ${zipEntry.name}:`, error);
                return null;
              }
            })
          );
        }
      });
      
      const results = await Promise.all(promises);
      const validResults = results.filter(result => result !== null);
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
            await notaFiscalAPI.importNotaFiscal({
              xml_content: xmlContent,
              xml_filename: file.name,
              tipo: importType,
              origem: importOrigin
            });
            
            processedCount++;
            toast.success(`Nota fiscal ${file.name} importada com sucesso!`);
          } else if (file.name.endsWith('.zip')) {
            // Processar arquivo ZIP
            const zipResults = await processZipFile(file);
            
            // Importar cada XML do ZIP
            for (const xmlData of zipResults) {
              try {
                await notaFiscalAPI.importNotaFiscal({
                  xml_content: xmlData.xmlContent,
                  xml_filename: xmlData.numero + '.xml',
                  tipo: importType,
                  origem: importOrigin
                });
                
                processedCount++;
                toast.success(`Nota fiscal ${xmlData.numero} importada com sucesso!`);
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
        toast.success(`${processedCount} nota(s) fiscal(is) importada(s) com sucesso!`);
      }
    } catch (error) {
      console.error("Erro durante importação:", error);
      toast.error("Erro durante a importação");
    } finally {
      setIsImporting(false);
    }
  };

  // Função para cancelar importação
  const handleCancelImport = () => {
    setIsImportDialogOpen(false);
    setSelectedFiles(null);
    setImportType('saida');
    setImportOrigin('manual');
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

  // Função para obter dados paginados e ordenados
  const getPaginatedData = () => {
    const sortedData = sortData(notasFiscais);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  // Função para obter total de páginas
  const getTotalPages = () => {
    return Math.ceil(notasFiscais.length / itemsPerPage);
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

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NFs Este Mês</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+23 vs mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <FileText className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">R$ 245.680</div>
            <p className="text-xs text-muted-foreground">+18.5% vs mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">8</div>
            <p className="text-xs text-muted-foreground">Aguardando emissão</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emitidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">148</div>
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
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Relatório
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando notas fiscais...
                    </TableCell>
                  </TableRow>
                ) : notasFiscais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma nota fiscal encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  getPaginatedData().map((item) => (
                    <TableRow key={item.id}>
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, notasFiscais.length)} de {notasFiscais.length} notas fiscais
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
                <div className="flex items-center space-x-1">
                  {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === getTotalPages()}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              const emitenteCnpj = formData.get('emitenteCnpj') as string;

              // Validar se a nota fiscal já existe
              if (numero && emitenteCnpj) {
                const exists = await validateNotaFiscalExists(numero, emitenteCnpj);
                if (exists) {
                  setValidationErrors({
                    numero: `Já existe uma nota fiscal com o número ${numero} do emitente ${emitenteCnpj}`
                  });
                  toast.error(`Já existe uma nota fiscal com o número ${numero} do emitente ${emitenteCnpj}`);
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
    </div>
  );
} 