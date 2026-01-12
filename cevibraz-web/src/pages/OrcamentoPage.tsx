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
  materiaisDoQuadro: {} as Record<string, number>,
  espessuraPaspatur: "",
  isPaspaturVisivel: false,
  acrescimo: "",
  quantidade: "1", // Campo Novo
  resumoDoQuadro: "Preencha os campos para ver o resumo.",
};

export function OrcamentoPage() {
  const [moldurasList, setMoldurasList] = useState<Moldura[]>([]);
  const [materiaisList, setMateriaisList] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Campos do Cabeçalho
  const [atendente, setAtendente] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [condicaoPagamento, setCondicaoPagamento] = useState("");
  const [ocultarValoresUnitarios, setOcultarValoresUnitarios] = useState(false);

  // Estado do Formulário do Quadro Atual
  const [formQuadro, setFormQuadro] = useState(estadoInicialFormQuadro);

  // Lista de Quadros já adicionados ao Pedido
  const [quadrosDoPedido, setQuadrosDoPedido] = useState<QuadroNoEstado[]>([]);
  const [valorFinalManual, setValorFinalManual] = useState<number | null>(null);

  const [isSalvando, setIsSalvando] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { pedidoId } = useParams();
  const navigate = useNavigate();

  // --- Carregamento Inicial ---
  useEffect(() => {
    async function carregarDados() {
      try {
        setIsLoading(true);
        const [molduras, materiais] = await Promise.all([
          fetchMolduras(),
          fetchMateriais(),
        ]);
        setMoldurasList(molduras);
        setMateriaisList(materiais);

        // Se tiver ID na URL, carrega o pedido para edição
        if (pedidoId) {
          setIsEditing(true);
          const pedido = await fetchPedidoById(Number(pedidoId));
          setAtendente(pedido.atendente);
          setCliente(pedido.clienteNome);
          setTelefone(pedido.clienteTelefone);
          setObservacoes(pedido.observacoes);
          setCondicaoPagamento(pedido.condicao_pagamento || "");
          setQuadrosDoPedido(pedido.quadros);
          setValorFinalManual(
            pedido.valor_final_salvo !== pedido.quadros.reduce((acc, q) => acc + q.valorCalculado, 0)
              ? pedido.valor_final_salvo
              : null
          );
          setOcultarValoresUnitarios(pedido.ocultar_valores_unitarios || false);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Falha ao carregar dados. Verifique a API.");
      } finally {
        setIsLoading(false);
      }
    }
    carregarDados();
  }, [pedidoId]);

  // --- Lógica do Formulário ---

  // Cálculo automático do Resumo enquanto digita
  useEffect(() => {
    const calcularResumo = async () => {
      const {
        altura,
        largura,
        moldurasDoQuadro,
        materiaisDoQuadro,
        espessuraPaspatur,
        medidaCliente,
        isPaspaturVisivel,
        acrescimo,
        quantidade,
      } = formQuadro;

      if (!altura || !largura) {
        setFormQuadro((prev) => ({
          ...prev,
          resumoDoQuadro: "Preencha altura e largura...",
        }));
        return;
      }

      const materiaisSelecionados = Object.keys(materiaisDoQuadro).filter(
        (k) => materiaisDoQuadro[k] > 0
      );

      const dto: CalcularQuadroDto = {
        altura: parseFloat(altura),
        largura: parseFloat(largura),
        moldurasSelecionadas: moldurasDoQuadro,
        materiaisSelecionados: materiaisSelecionados,
        espessuraPaspatur: isPaspaturVisivel ? parseFloat(espessuraPaspatur) || 0 : 0,
        medidaFornecidaCliente: medidaCliente,
        limpezaSelecionada: false,
        acrescimo_cm: parseFloat(acrescimo) || 0,
      };

      try {
        const resultado = await calcularPrecoQuadro(dto);
        
        // CORREÇÃO: Multiplica pelo número de quadros
        const qtd = Math.max(1, parseInt(quantidade) || 1);
        const totalMultiplicado = resultado.total * qtd;

        setFormQuadro((prev) => ({
          ...prev,
          resumoDoQuadro: `Total Unitário: R$ ${resultado.total.toFixed(2)}\nQuantidade: ${qtd}\nTotal Item: R$ ${totalMultiplicado.toFixed(2)}\n\n${resultado.detalhes.join("\n")}`,
        }));
      } catch (error) {
        console.error(error);
        setFormQuadro((prev) => ({
          ...prev,
          resumoDoQuadro: "Erro ao calcular.",
        }));
      }
    };

    const timer = setTimeout(calcularResumo, 500); // Debounce para não travar
    return () => clearTimeout(timer);
  }, [formQuadro.altura, formQuadro.largura, formQuadro.moldurasDoQuadro, formQuadro.materiaisDoQuadro, formQuadro.espessuraPaspatur, formQuadro.medidaCliente, formQuadro.isPaspaturVisivel, formQuadro.acrescimo, formQuadro.quantidade]);

  const handleAddMoldura = () => {
    const { molduraSelecionada, moldurasDoQuadro } = formQuadro;
    if (!molduraSelecionada) return alert("Selecione uma moldura primeiro.");

    setFormQuadro((prev) => ({
      ...prev,
      moldurasDoQuadro: [...moldurasDoQuadro, molduraSelecionada],
      molduraSelecionada: "", // Limpa seleção atual
    }));
  };

  const handleRemoveUltimaMoldura = () => {
    setFormQuadro((prev) => {
      const novaLista = [...prev.moldurasDoQuadro];
      novaLista.pop();
      return { ...prev, moldurasDoQuadro: novaLista };
    });
  };

  const handleMaterialChange = (materialNome: string, quantidade: number) => {
    setFormQuadro((prev) => {
      const novosMateriais = { ...prev.materiaisDoQuadro };
      if (quantidade > 0) {
        novosMateriais[materialNome] = quantidade;
      } else {
        delete novosMateriais[materialNome];
      }

      // Lógica do Paspatur
      const temPaspatur = Object.keys(novosMateriais).some((m) =>
        m.toLowerCase().includes("paspatur")
      );

      return {
        ...prev,
        materiaisDoQuadro: novosMateriais,
        isPaspaturVisivel: temPaspatur,
        espessuraPaspatur: temPaspatur ? prev.espessuraPaspatur : "",
      };
    });
  };

  const handleLimparCampos = () => {
    setFormQuadro(estadoInicialFormQuadro);
  };

  // --- Adicionar Quadro ao Pedido ---
  const handleAdicionarQuadro = useCallback(async () => {
    const {
      altura,
      largura,
      moldurasDoQuadro,
      materiaisDoQuadro,
      espessuraPaspatur,
      medidaCliente,
      isPaspaturVisivel,
      acrescimo,
      quantidade,
    } = formQuadro;

    if (!altura || !largura) return alert("Preencha as dimensões.");
    if (moldurasDoQuadro.length === 0 && Object.keys(materiaisDoQuadro).length === 0) {
      return alert("Adicione pelo menos uma moldura ou material.");
    }
    if (isPaspaturVisivel && !espessuraPaspatur) {
      return alert("Informe a espessura do Paspatur.");
    }

    const materiaisSelecionados = Object.keys(materiaisDoQuadro).filter(
      (k) => materiaisDoQuadro[k] > 0
    );

    const dto: CalcularQuadroDto = {
      altura: parseFloat(altura),
      largura: parseFloat(largura),
      moldurasSelecionadas: moldurasDoQuadro,
      materiaisSelecionados: materiaisSelecionados,
      espessuraPaspatur: isPaspaturVisivel ? parseFloat(espessuraPaspatur) || 0 : 0,
      medidaFornecidaCliente: medidaCliente,
      limpezaSelecionada: false,
      acrescimo_cm: parseFloat(acrescimo) || 0,
    };

    try {
      setIsLoading(true);
      const resultado = await calcularPrecoQuadro(dto);

      // --- CORREÇÃO: Multiplicar pela quantidade ---
      const qtd = Math.max(1, parseInt(quantidade) || 1);
      const valorTotalItem = resultado.total * qtd;

      const novoQuadro: QuadroNoEstado = {
        id: Date.now(), // ID temporário p/ front
        altura: parseFloat(altura),
        largura: parseFloat(largura),
        moldurasSelecionadas: moldurasDoQuadro,
        materiaisSelecionados: materiaisSelecionados,
        espessuraPaspatur: isPaspaturVisivel ? parseFloat(espessuraPaspatur) || 0 : 0,
        medidaFornecidaCliente: medidaCliente,
        limpezaSelecionada: false,
        
        // Aqui salvamos o valor TOTAL (Unitário * Qtd)
        valorCalculado: valorTotalItem, 
        
        // Salvamos a quantidade para exibir no resumo
        quantidade: qtd,
        
        detalhesCalculo: resultado.detalhes,
        acrescimo_cm: parseFloat(acrescimo) || 0,
      };

      setQuadrosDoPedido((prev) => [...prev, novoQuadro]);
      handleLimparCampos();
    } catch (err) {
      console.error(err);
      alert("Erro ao calcular quadro final.");
    } finally {
      setIsLoading(false);
    }
  }, [formQuadro]);

  // --- Ações do Pedido ---

  const handleDeleteQuadro = (id: number) => {
    if (confirm("Remover este quadro do pedido?")) {
      setQuadrosDoPedido((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const handleLimparPedido = () => {
    if (confirm("Limpar todo o pedido?")) {
      setQuadrosDoPedido([]);
      setValorFinalManual(null);
      setAtendente("");
      setCliente("");
      setTelefone("");
      setObservacoes("");
      setCondicaoPagamento("");
    }
  };

  const valorTotalPedido = quadrosDoPedido.reduce((acc, q) => acc + q.valorCalculado, 0);

  const handleSalvarPedido = async () => {
    if (quadrosDoPedido.length === 0) return alert("Adicione quadros ao pedido.");
    if (!atendente || !cliente) return alert("Preencha Atendente e Cliente.");

    setIsSalvando(true);
    try {
      if (isEditing && pedidoId) {
        // --- Atualização (PUT) ---
        const updateDto: PedidoUpdateDto = {
            observacoes,
            condicao_pagamento: condicaoPagamento,
            quadros: quadrosDoPedido,
            valor_final_calculado: valorTotalPedido,
            valor_final_manual: valorFinalManual ?? undefined,
            ocultar_valores_unitarios: ocultarValoresUnitarios,
        };
        await updatePedido(Number(pedidoId), updateDto);
        alert("Pedido atualizado com sucesso!");
        navigate("/backlog");
      } else {
        // --- Criação (POST) ---
        const dto: PedidoApiDto = {
          nomeAtendente: atendente,
          nomeCliente: cliente,
          telefoneCliente: telefone,
          observacoes,
          condicao_pagamento: condicaoPagamento,
          quadros: quadrosDoPedido,
          valor_final_calculado: valorTotalPedido,
          valor_final_manual: valorFinalManual ?? undefined,
          ocultar_valores_unitarios: ocultarValoresUnitarios,
        };

        const response = await salvarPedido(dto);
        
        // --- Geração de PDF automática ao salvar ---
        if (response.pdf_pedido_url) {
            // Tenta abrir o PDF gerado pelo backend
            window.open(response.pdf_pedido_url, "_blank");
        } else if (response.pedidoId) {
             // Fallback: Tenta gerar na hora se não veio URL
            try {
                const pdfBase64 = await fetchPdfBase64(response.pedidoId, "pedido");
                const blob = b64toBlob(pdfBase64, "application/pdf");
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
            } catch (e) {
                console.error("Erro ao abrir PDF pós-salvamento", e);
            }
        }
        
        alert(`Pedido #${response.numeroPedido} salvo com sucesso!`);
        handleLimparPedido();
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar pedido.");
    } finally {
      setIsSalvando(false);
    }
  };

  // Função utilitária para converter base64 em Blob (caso precise gerar PDF localmente)
  const b64toBlob = (b64Data: string, contentType = "", sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };


  if (isLoading && !moldurasList.length) {
    return <div className="page-content"><div className="container">Carregando sistema...</div></div>;
  }
  if (error) {
    return <div className="page-content"><div className="container text-danger">{error}</div></div>;
  }

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="page-title">
            {isEditing ? `Editando Pedido #${pedidoId}` : "Novo Orçamento"}
        </h1>

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
          acrescimo={formQuadro.acrescimo}
          quantidade={formQuadro.quantidade} // Passando o valor
          
          onAtendenteChange={setAtendente}
          onClienteChange={setCliente}
          onTelefoneChange={setTelefone}
          onAlturaChange={(v) =>
            setFormQuadro((f) => ({ ...f, altura: v }))
          }
          onLarguraChange={(v) =>
            setFormQuadro((f) => ({ ...f, largura: v }))
          }
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
          onAcrescimoChange={(v) =>
            setFormQuadro((f) => ({ ...f, acrescimo: v }))
          }
          onLimparCampos={handleLimparCampos}
          onAdicionarQuadro={handleAdicionarQuadro}
          condicaoPagamento={condicaoPagamento}
          onCondicaoPagamentoChange={setCondicaoPagamento}
          
          // --- CORREÇÃO AQUI: Implementando a função que estava faltando ---
          onQuantidadeChange={(v) =>
            setFormQuadro((f) => ({ ...f, quantidade: v }))
          }
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
