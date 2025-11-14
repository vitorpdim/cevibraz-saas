import { useState, useEffect, useCallback } from "react";
import {
  fetchMolduras,
  fetchMateriais,
  calcularPrecoQuadro,
  salvarPedido,
  fetchPdfBase64,
  fetchPedidoById,
  updatePedido,
} from "../services/api";
import type {
  Moldura,
  Material,
  QuadroNoEstado,
  CalcularQuadroDto,
  PedidoApiDto, // <<< CORREÇÃO 1: Importado de '../types'
} from "../types";

import { OrcamentoForm } from "../components/OrcamentoForm";
import { ResumoPedido } from "../components/ResumoPedido";
import { useParams, useNavigate } from "react-router-dom";

const estadoInicialFormQuadro = {
  altura: "",
  largura: "",
  medidaCliente: false,
  molduraSelecionada: "",
  moldurasDoQuadro: [] as string[],
  materiaisDoQuadro: [] as string[],
  espessuraPaspatur: "",
  isPaspaturVisivel: false,
  resumoDoQuadro: "Preencha os campos para ver o resumo.",
};

export function OrcamentoPage() {
  // --- Seus Estados (Mantidos) ---
  const [moldurasList, setMoldurasList] = useState<Moldura[]>([]);
  const [materiaisList, setMateriaisList] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atendente, setAtendente] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [quadrosDoPedido, setQuadrosDoPedido] = useState<QuadroNoEstado[]>([]);
  const [valorTotalPedido, setValorTotalPedido] = useState(0); // Mantido em 0 (corrige bug 'toFixed')
  const [formQuadro, setFormQuadro] = useState(estadoInicialFormQuadro);
  const { pedidoId } = useParams<{ pedidoId?: string }>();
  const navigate = useNavigate();

  // --- CORREÇÃO 2: Estados de Controle Aprimorados ---
  const [valorFinalManual, setValorFinalManual] = useState<number | null>(null); // Usando null
  const [isEditing, setIsEditing] = useState(false); // Renomeado de 'editando'
  const [isSalvando, setIsSalvando] = useState(false); // Novo estado de loading

  // --- Seu useEffect de Carregar Dados (Mantido) ---
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        setIsLoading(true); // Mantido
        setError(null);
        const [moldurasData, materiaisData] = await Promise.all([
          fetchMolduras(),
          fetchMateriais(),
        ]);
        setMoldurasList(moldurasData);
        setMateriaisList(materiaisData);
      } catch (err) {
        console.error("Erro ao buscar dados iniciais:", err);
        setError("Falha ao carregar dados da API. Verifique o backend.");
      } finally {
        // ATENÇÃO: O setIsLoading(false) foi movido para o useEffect[pedidoId]
        // para garantir que ambos os carregamentos terminem.
      }
    };
    carregarDadosIniciais();
  }, []);

  // --- Seu useEffect de Calcular Total (Mantido) ---
  useEffect(() => {
    const total = quadrosDoPedido.reduce(
      (acc, quadro) => acc + quadro.valorCalculado,
      0
    );
    setValorTotalPedido(total);
  }, [quadrosDoPedido]);

  // --- Seu useEffect de Resumo do Quadro (Mantido) ---
  useEffect(() => {
    const {
      altura,
      largura,
      moldurasDoQuadro,
      materiaisDoQuadro,
      espessuraPaspatur,
      isPaspaturVisivel,
    } = formQuadro;

    let resumo = "Preencha os campos para ver o resumo."; // Padrão

    if (
      altura ||
      largura ||
      moldurasDoQuadro.length > 0 ||
      materiaisDoQuadro.length > 0
    ) {
      resumo = `Medidas: ${altura || 0}cm x ${largura || 0}cm.\n`;
      if (moldurasDoQuadro.length > 0) {
        resumo += `Molduras: ${moldurasDoQuadro.join(", ")}.\n`;
      }
      if (materiaisDoQuadro.length > 0) {
        resumo += `Materiais: ${materiaisDoQuadro.join(", ")}.\n`;
      }
      if (isPaspaturVisivel && espessuraPaspatur) {
        resumo += `Esp. Paspatur: ${espessuraPaspatur}cm.`;
      }
    }

    setFormQuadro((prevState) => {
      if (prevState.resumoDoQuadro === resumo) {
        return prevState;
      }
      return { ...prevState, resumoDoQuadro: resumo };
    });
  }, [
    formQuadro.altura,
    formQuadro.largura,
    formQuadro.moldurasDoQuadro,
    formQuadro.materiaisDoQuadro,
    formQuadro.espessuraPaspatur,
    formQuadro.isPaspaturVisivel,
    formQuadro, // Dependência completa (como estava no seu código)
  ]);

  // --- Suas Funções de Formulário (Mantidas) ---
  const handleAddMoldura = () => {
    if (
      formQuadro.molduraSelecionada &&
      !formQuadro.moldurasDoQuadro.includes(formQuadro.molduraSelecionada)
    ) {
      setFormQuadro((prevState) => ({
        ...prevState,
        moldurasDoQuadro: [
          ...prevState.moldurasDoQuadro,
          prevState.molduraSelecionada,
        ],
        molduraSelecionada: "",
      }));
    }
  };

  const handleRemoveUltimaMoldura = () => {
    setFormQuadro((prevState) => ({
      ...prevState,
      moldurasDoQuadro: prevState.moldurasDoQuadro.slice(0, -1),
    }));
  };

  const handleMaterialChange = (materialNome: string, isChecked: boolean) => {
    setFormQuadro((prevState) => {
      const novosMateriais = isChecked
        ? [...prevState.materiaisDoQuadro, materialNome]
        : prevState.materiaisDoQuadro.filter((m) => m !== materialNome);

      const paspaturVisivel = novosMateriais.includes("Paspatur");

      return {
        ...prevState,
        materiaisDoQuadro: novosMateriais,
        isPaspaturVisivel: paspaturVisivel,
        espessuraPaspatur: paspaturVisivel ? prevState.espessuraPaspatur : "",
      };
    });
  };

  const handleLimparCampos = () => {
    setFormQuadro(estadoInicialFormQuadro);
  };

  // --- Sua Função de Adicionar Quadro (Mantida) ---
  const handleAdicionarQuadro = useCallback(async () => {
    const alturaNum = parseFloat(formQuadro.altura);
    const larguraNum = parseFloat(formQuadro.largura);
    if (
      isNaN(alturaNum) ||
      isNaN(larguraNum) ||
      alturaNum <= 0 ||
      larguraNum <= 0
    ) {
      alert("Altura e Largura devem ser números positivos.");
      return;
    }

    try {
      const dto: CalcularQuadroDto = {
        altura: alturaNum,
        largura: larguraNum,
        medidaFornecidaCliente: formQuadro.medidaCliente,
        moldurasSelecionadas: formQuadro.moldurasDoQuadro,
        materiaisSelecionados: formQuadro.materiaisDoQuadro,
        espessuraPaspatur: parseFloat(formQuadro.espessuraPaspatur || "0"),
        limpezaSelecionada: formQuadro.materiaisDoQuadro.includes("Limpeza"),
      };

      const resultadoCalculo = await calcularPrecoQuadro(dto);

      const novoQuadro: QuadroNoEstado = {
        id: Math.floor(Math.random() * 1e9),
        ...dto,
        valorCalculado: resultadoCalculo.total,
      };

      setQuadrosDoPedido((quadrosAtuais) => [...quadrosAtuais, novoQuadro]);

      setFormQuadro(() => ({
        ...estadoInicialFormQuadro,
        resumoDoQuadro: `Quadro ${alturaNum}x${larguraNum} adicionado! Valor: R$ ${resultadoCalculo.total.toFixed(
          2
        )}`,
      }));
    } catch (error: unknown) {
      // ... (Seu tratamento de erro mantido) ...
      interface AxiosErrorLike {
        response?: { data?: { message?: string } | string };
        message?: string;
      }
      const errObj = error as AxiosErrorLike;
      const responseData = errObj.response?.data;
      const serverMsg =
        (typeof responseData === "object" &&
          (responseData as { message?: string }).message) ||
        (typeof responseData === "string" && responseData) ||
        errObj.message ||
        "Erro desconhecido";
      console.error(
        "Erro ao calcular/adicionar quadro:",
        errObj.response ?? errObj
      );
      alert(`Erro ao calcular o preço: ${serverMsg}`);
    }
  }, [formQuadro]);

  // --- Sua Função de Deletar Quadro (Mantida) ---
  const handleDeleteQuadro = (indexParaRemover: number) => {
    setQuadrosDoPedido((quadrosAtuais) =>
      quadrosAtuais.filter((_, index) => index !== indexParaRemover)
    );
  };

  // --- CORREÇÃO 3: Lógica de Carregamento de Edição (Robusta) ---
  useEffect(() => {
    const carregarPedidoParaEdicao = async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const pedido = await fetchPedidoById(Number(id));

        setAtendente(pedido.atendente);
        setCliente(pedido.clienteNome);
        setTelefone(pedido.clienteTelefone);
        setObservacoes(pedido.observacoes);
        setQuadrosDoPedido(pedido.quadros);

        // Lógica correta para definir o valor total e o manual
        const valorCalculado = pedido.quadros.reduce(
          (acc, q) => acc + q.valorCalculado,
          0
        );
        setValorTotalPedido(valorCalculado); // Define o total calculado

        // Se o valor salvo for DIFERENTE do calculado, ele foi manual
        if (pedido.valor_final_salvo !== valorCalculado) {
          setValorFinalManual(pedido.valor_final_salvo);
        } else {
          setValorFinalManual(null); // Garante que é nulo
        }

        setIsEditing(true); // Ativa o modo de edição
      } catch (err) {
        console.error("Erro ao carregar pedido:", err);
        setError("Pedido não encontrado. Voltando para um novo orçamento.");
        navigate("/orcamento");
      } finally {
        setIsLoading(false); // Termina o carregamento GERAL
      }
    };

    // Lógica 'if/else' para limpar o form se não houver pedidoId
    if (pedidoId) {
      carregarPedidoParaEdicao(pedidoId);
    } else {
      handleLimparPedido(false); // false = não navegar
      setIsEditing(false);
      setIsLoading(false); // Termina o carregamento GERAL
    }
  }, [pedidoId, navigate]); // Dependências mantidas

  // --- CORREÇÃO 4: Funções de Salvar/Limpar Atualizadas ---

  const handleLimparPedido = (navegar = true) => {
    setAtendente("");
    setCliente("");
    setTelefone("");
    setObservacoes("");
    setQuadrosDoPedido([]);
    setFormQuadro(estadoInicialFormQuadro);
    setValorFinalManual(null); // Usando null
    setError(null);

    // Lógica de Edição
    setIsEditing(false);
    if (navegar && pedidoId) {
      navigate("/orcamento");
    }
  };

  const handleSalvarPedido = useCallback(async () => {
    if (!atendente || !cliente) {
      alert("Atendente e Cliente são obrigatórios.");
      return;
    }
    if (quadrosDoPedido.length === 0) {
      alert("Adicione pelo menos um quadro ao pedido.");
      return;
    }

    setIsSalvando(true); // Ativa o loading do botão

    // O DTO que o backend espera (definido em types.ts)
    const dto: PedidoApiDto = {
      nomeAtendente: atendente,
      nomeCliente: cliente,
      telefoneCliente: telefone,
      observacoes: observacoes,
      quadros: quadrosDoPedido, // Já está no formato correto (QuadroNoEstado)
      valor_final_calculado: valorTotalPedido, // O total calculado REAL
      valor_final_manual: valorFinalManual ?? undefined, // Envia o manual se não for null
    };

    try {
      let resposta;
      if (isEditing && pedidoId) {
        // --- MODO DE ATUALIZAÇÃO (PUT) ---
        resposta = await updatePedido(Number(pedidoId), dto);
        alert(`Pedido atualizado com sucesso!`);
        navigate("/backlog"); // Navega para o backlog
      } else {
        // --- MODO DE CRIAÇÃO (POST) ---
        resposta = await salvarPedido(dto);
        alert(`Pedido ${resposta.numeroPedido} salvo com sucesso!`);

        // Sua lógica de Download (Mantida)
        if (resposta.pdf_pedido_url) {
          const filename = `pedido_${resposta.numeroPedido}.pdf`;
          try {
            const base64Data = await fetchPdfBase64(resposta.pedidoId, "pdf");
            const link = document.createElement("a");
            link.href = `data:application/pdf;base64,${base64Data}`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (downloadError) {
            console.error("Erro ao baixar o PDF:", downloadError);
            alert("Erro ao baixar o PDF. Verifique o console.");
          }
        }
        handleLimparPedido(false); // Limpa o form sem navegar
      }
    } catch (error: unknown) {
      // ... (Seu tratamento de erro mantido) ...
      interface AxiosErrorLike {
        response?: { data?: { message?: string } | string };
        message?: string;
      }
      const errObj = error as AxiosErrorLike;
      const responseData = errObj.response?.data;
      const serverMsg =
        (typeof responseData === "object" &&
          (responseData as { message?: string }).message) ||
        (typeof responseData === "string" && responseData) ||
        errObj.message ||
        "Erro desconhecido";
      console.error("Erro ao salvar pedido:", errObj.response ?? errObj);
      alert(`Erro ao salvar o pedido: ${serverMsg}`);
    } finally {
      setIsSalvando(false); // Desativa o loading do botão
    }
  }, [
    atendente,
    cliente,
    telefone,
    observacoes,
    quadrosDoPedido,
    valorTotalPedido,
    valorFinalManual,
    isEditing, // Renomeado de 'editando'
    pedidoId,
    navigate,
  ]);

  // --- Sua Renderização (Mantida) ---
  if (isLoading) {
    return (
      <div className="container-principal text-center mt-5">
        <h2>Carregando Dados...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-principal text-center mt-5">
        <h2 className="text-danger">Erro de Conexão</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container-principal">
        <OrcamentoForm
          moldurasList={moldurasList}
          materiaisList={materiaisList}
          atendente={atendente}
          cliente={cliente}
          telefone={telefone}
          altura={formQuadro.altura}
          largura={formQuadro.largura}
          medidaCliente={formQuadro.medidaCliente}
          molduraSelecionada={formQuadro.molduraSelecionada}
          materiaisDoQuadro={formQuadro.materiaisDoQuadro}
          espessuraPaspatur={formQuadro.espessuraPaspatur}
          isPaspaturVisivel={formQuadro.isPaspaturVisivel}
          resumoDoQuadro={formQuadro.resumoDoQuadro}
          onAtendenteChange={setAtendente}
          onClienteChange={setCliente}
          onTelefoneChange={setTelefone}
          onAlturaChange={(v) => setFormQuadro((f) => ({ ...f, altura: v }))}
          onLarguraChange={(v) => setFormQuadro((f) => ({ ...f, largura: v }))}
          onMedidaClienteChange={(v) =>
            setFormQuadro((f) => ({ ...f, medidaCliente: v }))
          }
          onMolduraSelecionadaChange={(v) =>
            setFormQuadro((f) => ({ ...f, molduraSelecionada: v }))
          }
          onAddMoldura={handleAddMoldura}
          onRemoveUltimaMoldura={handleRemoveUltimaMoldura}
          onMaterialChange={handleMaterialChange}
          onEspessuraPaspaturChange={(v) =>
            setFormQuadro((f) => ({ ...f, espessuraPaspatur: v }))
          }
          onLimparCampos={handleLimparCampos}
          onAdicionarQuadro={handleAdicionarQuadro}
        />

        {/* --- CORREÇÃO 5: Props Atualizadas no ResumoPedido --- */}
        <ResumoPedido
          quadros={quadrosDoPedido}
          observacoes={observacoes}
          valorTotalPedido={valorTotalPedido}
          valorFinalManual={valorFinalManual ?? undefined} // Envia undefined se for null
          onObservacoesChange={setObservacoes}
          onLimparPedido={handleLimparPedido}
          onSalvarPedido={handleSalvarPedido}
          onDeleteQuadro={handleDeleteQuadro}
          onValorFinalManualChange={setValorFinalManual} // Passando o 'setter'
          isEditing={isEditing} // Prop de Edição
          isSalvando={isSalvando} // Prop de Loading
        />
      </div>
    </div>
  );
}

export default OrcamentoPage;
