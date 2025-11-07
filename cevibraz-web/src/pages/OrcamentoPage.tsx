import { useState, useEffect, useCallback } from "react";
import {
  fetchMolduras,
  fetchMateriais,
  calcularPrecoQuadro,
  salvarPedido,
  fetchPdfBase64,
} from "../services/api";
import type {
  Moldura,
  Material,
  QuadroParaSalvar,
  CalcularQuadroDto,
  CreatePedidoDto,
  SalvarPedidoResponse,
} from "../types";

import { OrcamentoForm } from "../components/OrcamentoForm";
import { ResumoPedido } from "../components/ResumoPedido";

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
  const [moldurasList, setMoldurasList] = useState<Moldura[]>([]);
  const [materiaisList, setMateriaisList] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atendente, setAtendente] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [quadrosDoPedido, setQuadrosDoPedido] = useState<QuadroParaSalvar[]>(
    []
  );
  const [valorTotalPedido, setValorTotalPedido] = useState(0);
  const [formQuadro, setFormQuadro] = useState(estadoInicialFormQuadro);

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
        console.error("Erro ao buscar dados iniciais:", err);
        setError("Falha ao carregar dados da API. Verifique o backend.");
      } finally {
        setIsLoading(false);
      }
    };
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    const total = quadrosDoPedido.reduce(
      (acc, quadro) => acc + quadro.valorCalculado,
      0
    );
    setValorTotalPedido(total);
  }, [quadrosDoPedido]);

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

      const novoQuadro: QuadroParaSalvar = {
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
    } catch (err: unknown) {
      console.error("Erro ao calcular/adicionar quadro:", err);
      if (err instanceof Error) {
        alert(`Erro ao calcular o preço: ${err.message}`);
      } else {
        alert("Erro ao calcular o preço. Verifique o console.");
      }
    }
  }, [formQuadro]);

  const handleLimparPedido = () => {
    setAtendente("");
    setCliente("");
    setTelefone("");
    setObservacoes("");
    setQuadrosDoPedido([]);
    setFormQuadro(estadoInicialFormQuadro);
  };

  const handleDeleteQuadro = (indexParaRemover: number) => {
    setQuadrosDoPedido((quadrosAtuais) =>
      quadrosAtuais.filter((_, index) => index !== indexParaRemover)
    );
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

    const dto: CreatePedidoDto = {
      nomeAtendente: atendente,
      nomeCliente: cliente,
      telefoneCliente: telefone,
      observacoes: observacoes,
      quadros: quadrosDoPedido,
      valor_final_calculado: valorTotalPedido,
    };

    try {
      const resposta: SalvarPedidoResponse = await salvarPedido(dto);

      alert(`Pedido ${resposta.numeroPedido} salvo com sucesso!`);

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

      handleLimparPedido();
    } catch (err: unknown) {
      console.error("Erro ao salvar pedido:", err);
      if (err instanceof Error) {
        alert(`Erro ao salvar o pedido: ${err.message}`);
      } else {
        alert("Erro ao salvar o pedido. Verifique o console.");
      }
    }
  }, [
    atendente,
    cliente,
    telefone,
    observacoes,
    quadrosDoPedido,
    valorTotalPedido,
  ]);

  // --- RENDERIZAÇÃO ---
  if (isLoading) {
    return (
      <div className="container-principal text-center mt-5">
        <h2>Carregando Dados da API...</h2>
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

      <ResumoPedido
        quadros={quadrosDoPedido}
        observacoes={observacoes}
        valorTotalPedido={valorTotalPedido}
        onObservacoesChange={setObservacoes}
        onLimparPedido={handleLimparPedido}
        onSalvarPedido={handleSalvarPedido}
        onDeleteQuadro={handleDeleteQuadro}
      />
    </div>
  );
}

export default OrcamentoPage;
