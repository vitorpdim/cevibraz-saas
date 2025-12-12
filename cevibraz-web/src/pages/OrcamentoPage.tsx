import { useState, useEffect, useCallback } from "react";
import {
  fetchMolduras,
  fetchMateriais,
  calcularPrecoQuadro,
  salvarPedido,
  fetchPedidoById,
  updatePedido,
  fetchPdfBase64,
} from "../services/api";
import type {
  Moldura,
  Material,
  QuadroNoEstado,
  CalcularQuadroDto,
  PedidoApiDto,
  PedidoUpdateDto,
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
  materiaisDoQuadro: {} as Record<string, number>, // agora mapa nome -> quantidade
  espessuraPaspatur: "",
  isPaspaturVisivel: false,
  acrescimo: "", // novo
  resumoDoQuadro: "Preencha os campos para ver o resumo.",
};

export function OrcamentoPage() {
  const [moldurasList, setMoldurasList] = useState<Moldura[]>([]);
  const [materiaisList, setMateriaisList] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atendente, setAtendente] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [condicaoPagamento, setCondicaoPagamento] = useState("");
  const [quadrosDoPedido, setQuadrosDoPedido] = useState<QuadroNoEstado[]>([]);
  const [valorTotalPedido, setValorTotalPedido] = useState(0);
  const [formQuadro, setFormQuadro] = useState(estadoInicialFormQuadro);
  const { pedidoId } = useParams<{ pedidoId?: string }>();
  const navigate = useNavigate();
  const [valorFinalManual, setValorFinalManual] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSalvando, setIsSalvando] = useState(false);
  const [ocultarValoresUnitarios, setOcultarValoresUnitarios] = useState(false);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [moldurasData, materiaisData] = await Promise.all([
          fetchMolduras(),
          fetchMateriais(),
        ]);
        setMoldurasList(moldurasData);
        setMateriaisList(materiaisData);
      } catch (err) {
        console.error("erro ao buscar dados iniciais:", err);
        setError("Falha ao carregar dados da API. Verifique o backend!");
      } finally {
        //fodase
      }
    };
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    const total = quadrosDoPedido.reduce(
      (acc, quadro) => acc + quadro.valorCalculado,
      0
    );
    const totalArredondado = parseFloat(total.toFixed(2));
    setValorTotalPedido(totalArredondado);
  }, [quadrosDoPedido]);

  // atualiza o resumo com base nos materiais (agora mapa)
  useEffect(() => {
    const {
      altura,
      largura,
      moldurasDoQuadro,
      materiaisDoQuadro,
      espessuraPaspatur,
      isPaspaturVisivel,
    } = formQuadro;

    let resumo = "Preencha os campos para ver o resumo.";

    const materiaisSelecionadosNomes = Object.entries(materiaisDoQuadro || {})
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, qty]) => qty > 0)
      .map(([name, qty]) => `${name}${qty > 1 ? ` x${qty}` : ""}`);

    if (
      altura ||
      largura ||
      moldurasDoQuadro.length > 0 ||
      materiaisSelecionadosNomes.length > 0
    ) {
      resumo = `Medidas: ${altura || 0}cm x ${largura || 0}cm.\n`;
      if (moldurasDoQuadro.length > 0) {
        resumo += `Molduras: ${moldurasDoQuadro.join(", ")}.\n`;
      }
      if (materiaisSelecionadosNomes.length > 0) {
        resumo += `Materiais: ${materiaisSelecionadosNomes.join(", ")}.\n`;
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
  ]);

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

  const handleMaterialChange = (materialNome: string, quantidade: number) => {
    setFormQuadro((prevState) => {
      const novos = { ...(prevState.materiaisDoQuadro || {}) };
      if (quantidade <= 0) {
        delete novos[materialNome];
      } else {
        novos[materialNome] = quantidade;
      }
      return {
        ...prevState,
        materiaisDoQuadro: novos,
        isPaspaturVisivel: Object.keys(novos).some((n) => n === "Paspatur"),
      };
    });
  };

  const handleLimparCampos = () => {
    setFormQuadro(estadoInicialFormQuadro);
  };

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
      // criar array de materiais repetidos conforme quantidades
      const materiaisSelecionadosArray: string[] = [];
      for (const [nome, qty] of Object.entries(
        formQuadro.materiaisDoQuadro || {}
      )) {
        for (let i = 0; i < Math.max(0, Math.floor(qty)); i++) {
          materiaisSelecionadosArray.push(nome);
        }
      }

      const dto: CalcularQuadroDto = {
        altura: alturaNum,
        largura: larguraNum,
        medidaFornecidaCliente: formQuadro.medidaCliente,
        moldurasSelecionadas: formQuadro.moldurasDoQuadro,
        materiaisSelecionados: materiaisSelecionadosArray,
        espessuraPaspatur: parseFloat(formQuadro.espessuraPaspatur || "0"),
        limpezaSelecionada: materiaisSelecionadosArray.includes("Limpeza"),
        acrescimo_cm: parseFloat(formQuadro.acrescimo || "0"), // novo
      };

      const resultadoCalculo = await calcularPrecoQuadro(dto);

      const novoQuadro: QuadroNoEstado = {
        id: Math.floor(Math.random() * 1e9),
        altura: dto.altura,
        largura: dto.largura,
        moldurasSelecionadas: dto.moldurasSelecionadas,
        materiaisSelecionados: dto.materiaisSelecionados,
        espessuraPaspatur: dto.espessuraPaspatur,
        medidaFornecidaCliente: dto.medidaFornecidaCliente,
        limpezaSelecionada: dto.limpezaSelecionada,
        valorCalculado: resultadoCalculo.total,
        detalhesCalculo: resultadoCalculo.detalhes,
      };

      setQuadrosDoPedido((quadrosAtuais) => [...quadrosAtuais, novoQuadro]);

      setFormQuadro(() => ({
        ...estadoInicialFormQuadro,
        resumoDoQuadro: `Quadro ${alturaNum}x${larguraNum} adicionado! Valor: R$ ${resultadoCalculo.total.toFixed(
          2
        )}`,
      }));
    } catch (err: unknown) {
      console.error("Erro ao calcular/adicionar quadro:", err);
      alert("Erro ao calcular o preço. Verifique o console.");
    }
  }, [formQuadro]);

  const handleDeleteQuadro = (indexParaRemover: number) => {
    setQuadrosDoPedido((quadrosAtuais) =>
      quadrosAtuais.filter((_, index) => index !== indexParaRemover)
    );
  };

  // ao carregar um pedido p edição aplica a flag
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
        setCondicaoPagamento(pedido.condicao_pagamento || "");
        setQuadrosDoPedido(pedido.quadros);

        const valorCalculado = pedido.quadros.reduce(
          (acc, q) => acc + q.valorCalculado,
          0
        );
        setValorTotalPedido(valorCalculado);

        if (pedido.valor_final_salvo !== valorCalculado) {
          setValorFinalManual(pedido.valor_final_salvo);
        } else {
          setValorFinalManual(null);
        }

        // aplica preferência do pedido
        setOcultarValoresUnitarios(pedido.ocultar_valores_unitarios ?? false);

        setIsEditing(true);
      } catch (err) {
        console.error("Erro ao carregar pedido:", err);
        setError("Pedido não encontrado. Voltando para um novo orçamento.");
        navigate("/orcamento");
      } finally {
        setIsLoading(false);
      }
    };

    if (pedidoId) {
      carregarPedidoParaEdicao(pedidoId);
    } else {
      handleLimparPedido(false);
      setIsEditing(false);
      setIsLoading(false);
    }
  }, [pedidoId, navigate]);

  const handleLimparPedido = (navegar = true) => {
    setAtendente("");
    setCliente("");
    setTelefone("");
    setObservacoes("");
    setQuadrosDoPedido([]);
    setFormQuadro(estadoInicialFormQuadro);
    setValorFinalManual(null);
    setError(null);

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

    setIsSalvando(true);

    const dadosBase = {
      observacoes: observacoes,
      condicao_pagamento: condicaoPagamento,
      quadros: quadrosDoPedido,
      valor_final_calculado: valorTotalPedido,
      valor_final_manual: valorFinalManual ?? undefined,
      ocultar_valores_unitarios: ocultarValoresUnitarios, // envia a preferência
    };

    try {
      let resposta;

      if (isEditing && pedidoId) {
        const updatePayload: PedidoUpdateDto = { ...dadosBase };
        resposta = await updatePedido(Number(pedidoId), updatePayload);
        alert("Pedido atualizado com sucesso!");
        navigate("/backlog");
      } else {
        const createPayload: PedidoApiDto = {
          ...dadosBase,
          nomeAtendente: atendente,
          nomeCliente: cliente,
          telefoneCliente: telefone,
        };

        resposta = await salvarPedido(createPayload);
        alert(`Pedido ${resposta.numeroPedido} salvo com sucesso!`);

        if (resposta.pdf_pedido_url) {
          try {
            const pdfBase64 = await fetchPdfBase64(resposta.pedidoId, "pdf");
            const link = document.createElement("a");
            link.href = `data:application/pdf;base64,${pdfBase64}`;
            link.download = `pedido_${resposta.numeroPedido}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (downloadError) {
            console.warn("Erro ao baixar PDF automático:", downloadError);
            alert("Pedido salvo! O PDF pode ser baixado no Backlog.");
          }
        }
        handleLimparPedido(false);
      }
    } catch (error: unknown) {
      let serverMsg = "Erro desconhecido";

      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosError = error as { response?: { data?: unknown } };
        const data = axiosError.response?.data;

        if (typeof data === "string") {
          serverMsg = data;
        } else if (typeof data === "object" && data !== null) {
          if ("message" in data) {
            const msgProp = (data as { message: unknown }).message;

            if (Array.isArray(msgProp)) {
              serverMsg = msgProp.join(", ");
            } else if (typeof msgProp === "string") {
              serverMsg = msgProp;
            }
          }
        }
      } else if (error instanceof Error) {
        serverMsg = error.message;
      }

      console.error("Erro ao salvar:", error);
      alert(`Erro ao salvar o pedido: ${serverMsg}`);
    } finally {
      setIsSalvando(false);
    }
  }, [
    atendente,
    cliente,
    telefone,
    observacoes,
    condicaoPagamento,
    quadrosDoPedido,
    valorTotalPedido,
    valorFinalManual,
    isEditing,
    pedidoId,
    navigate,
    ocultarValoresUnitarios,
  ]);

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
          acrescimo={formQuadro.acrescimo}
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
          onAcrescimoChange={(v) => setFormQuadro((f) => ({ ...f, acrescimo: v }))}
          onLimparCampos={handleLimparCampos}
          onAdicionarQuadro={handleAdicionarQuadro}
          condicaoPagamento={condicaoPagamento}
          onCondicaoPagamentoChange={setCondicaoPagamento}
        />

        <ResumoPedido
          quadros={quadrosDoPedido}
          observacoes={observacoes}
          valorTotalPedido={valorTotalPedido}
          valorFinalManual={valorFinalManual ?? undefined}
          onObservacoesChange={setObservacoes}
          onLimparPedido={handleLimparPedido}
          onSalvarPedido={handleSalvarPedido}
          onDeleteQuadro={handleDeleteQuadro}
          onValorFinalManualChange={setValorFinalManual}
          onQuadrosChange={setQuadrosDoPedido}
          isEditing={isEditing}
          isSalvando={isSalvando}
          ocultarValoresUnitarios={ocultarValoresUnitarios}
          onOcultarValoresUnitariosChange={setOcultarValoresUnitarios}
        />
      </div>
    </div>
  );
}

export default OrcamentoPage;
