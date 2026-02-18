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

interface QuadroMolduraAninhada {
  moldura?: { nome: string; codigo: string };
}

interface QuadroMaterialAninhada {
  material?: { nome: string };
}

interface QuadroApiResponse {
  id: number;
  altura?: number;
  largura?: number;
  altura_cm?: number;
  largura_cm?: number;
  quadroMolduras?: QuadroMolduraAninhada[];
  quadroMateriais?: QuadroMaterialAninhada[];
  moldurasSelecionadas?: string[];
  materiaisSelecionados?: string[];
  espessuraPaspatur?: number;
  espessura_paspatur_cm?: number;
  medidaFornecidaCliente: boolean;
  limpezaSelecionada: boolean;
  valorCalculado?: number;
  detalhesCalculo?: string[];
  acrescimo_cm?: number;
  quantidade?: number;
}

import { OrcamentoForm } from "../components/OrcamentoForm";
import { ResumoPedido } from "../components/ResumoPedido";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://cevibraz-api.onrender.com";

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
  quantidade: "1",
  resumoDoQuadro: "Preencha os campos para ver o resumo.",
};


function gerarListaMateriaisComQuantidade(
  materiaisDoQuadro: Record<string, number>
): string[] {
  const lista: string[] = [];
  for (const [materialNome, quantidade] of Object.entries(materiaisDoQuadro)) {
    if (quantidade > 0) {
      for (let i = 0; i < quantidade; i++) {
        lista.push(materialNome);
      }
    }
  }
  return lista;
}

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
  const [ocultarValoresUnitarios, setOcultarValoresUnitarios] = useState(false);
  const [numeroPedidoDisplay, setNumeroPedidoDisplay] = useState("");
  const [formQuadro, setFormQuadro] = useState(estadoInicialFormQuadro);
  const [quadrosDoPedido, setQuadrosDoPedido] = useState<QuadroNoEstado[]>([]);
  const [valorFinalManual, setValorFinalManual] = useState<number | null>(null);
  const [isSalvando, setIsSalvando] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { pedidoId } = useParams();
  const navigate = useNavigate();

  // --- CARREGAMENTO DE DADOS ---
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

        if (pedidoId) {
          setIsEditing(true);
          const pedido = await fetchPedidoById(Number(pedidoId));
          
          setNumeroPedidoDisplay(pedido.numero_pedido);
          setAtendente(pedido.atendente);
          setCliente(pedido.clienteNome);
          setTelefone(pedido.clienteTelefone);
          setObservacoes(pedido.observacoes);
          setCondicaoPagamento(pedido.condicao_pagamento || "");
          
          const quadrosFormatados = pedido.quadros.map((q: QuadroApiResponse) => {
            const moldurasSelecionadas: string[] = q.quadroMolduras
              ? q.quadroMolduras
                  .map((qm: QuadroMolduraAninhada) => qm.moldura?.nome || qm.moldura?.codigo)
                  .filter((nome): nome is string => Boolean(nome))
              : (q.moldurasSelecionadas || []);

            const materiaisSelecionados: string[] = q.quadroMateriais
              ? q.quadroMateriais
                  .map((qm: QuadroMaterialAninhada) => qm.material?.nome)
                  .filter((nome): nome is string => Boolean(nome))
              : (q.materiaisSelecionados || []);

            return {
              id: q.id,
              altura: Number(q.altura || q.altura_cm || 0),
              largura: Number(q.largura || q.largura_cm || 0),
              moldurasSelecionadas,
              materiaisSelecionados,
              espessuraPaspatur: Number(q.espessuraPaspatur || q.espessura_paspatur_cm || 0),
              medidaFornecidaCliente: Boolean(q.medidaFornecidaCliente),
              limpezaSelecionada: Boolean(q.limpezaSelecionada),
              valorCalculado: Number(q.valorCalculado || 0),
              detalhesCalculo: q.detalhesCalculo || [],
              acrescimo_cm: Number(q.acrescimo_cm || 0),
              quantidade: Number(q.quantidade || 1),
            } as QuadroNoEstado;
          });

          setQuadrosDoPedido(quadrosFormatados);
          
          const totalCalculado = quadrosFormatados.reduce(
            (acc: number, q: QuadroNoEstado) => acc + q.valorCalculado,
            0,
          );
          const totalSalvo = Number(pedido.valor_final_salvo || 0);
          
          setValorFinalManual(
            Math.abs(totalSalvo - totalCalculado) > 0.05 ? totalSalvo : null,
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

  // --- logica do forms ---

  // calc automatico do resumo enquanto digita
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

      // 🔧 CORREÇÃO: Usar função auxiliar para gerar lista com repetições
      const materiaisSelecionados = gerarListaMateriaisComQuantidade(
        materiaisDoQuadro
      );

      const dto: CalcularQuadroDto = {
        altura: parseFloat(altura),
        largura: parseFloat(largura),
        moldurasSelecionadas: moldurasDoQuadro,
        materiaisSelecionados: materiaisSelecionados,
        espessuraPaspatur: isPaspaturVisivel
          ? parseFloat(espessuraPaspatur) || 0
          : 0,
        medidaFornecidaCliente: medidaCliente,
        limpezaSelecionada: false,
        acrescimo_cm: parseFloat(acrescimo) || 0,
      };

      try {
        const resultado = await calcularPrecoQuadro(dto);

        // multiplica pelo numero de quadros
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

    const timer = setTimeout(calcularResumo, 500); // debounce p nao travar
    return () => clearTimeout(timer);
  }, [
    formQuadro.altura,
    formQuadro.largura,
    formQuadro.moldurasDoQuadro,
    formQuadro.materiaisDoQuadro,
    formQuadro.espessuraPaspatur,
    formQuadro.medidaCliente,
    formQuadro.isPaspaturVisivel,
    formQuadro.acrescimo,
    formQuadro.quantidade,
  ]);

  const handleAddMoldura = () => {
    const { molduraSelecionada, moldurasDoQuadro } = formQuadro;
    if (!molduraSelecionada) return alert("Selecione uma moldura primeiro.");

    setFormQuadro((prev) => ({
      ...prev,
      moldurasDoQuadro: [...moldurasDoQuadro, molduraSelecionada],
      molduraSelecionada: "",
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

      // logica do paspatur
      const temPaspatur = Object.keys(novosMateriais).some((m) =>
        m.toLowerCase().includes("paspatur"),
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

  // --- add quadro no pedido ---
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
    if (
      moldurasDoQuadro.length === 0 &&
      Object.keys(materiaisDoQuadro).length === 0
    ) {
      return alert("Adicione pelo menos uma moldura ou material.");
    }
    if (isPaspaturVisivel && !espessuraPaspatur) {
      return alert("Informe a espessura do Paspatur.");
    }

    const materiaisSelecionados = gerarListaMateriaisComQuantidade(
      materiaisDoQuadro
    );

    const dto: CalcularQuadroDto = {
      altura: parseFloat(altura),
      largura: parseFloat(largura),
      moldurasSelecionadas: moldurasDoQuadro,
      materiaisSelecionados: materiaisSelecionados,
      espessuraPaspatur: isPaspaturVisivel
        ? parseFloat(espessuraPaspatur) || 0
        : 0,
      medidaFornecidaCliente: medidaCliente,
      limpezaSelecionada: false,
      acrescimo_cm: parseFloat(acrescimo) || 0,
    };

    try {
      setIsLoading(true);
      const resultado = await calcularPrecoQuadro(dto);
      const qtd = Math.max(1, parseInt(quantidade) || 1);
      const valorTotalItem = resultado.total * qtd;
      const novoId = Date.now() + Math.floor(Math.random() * 100000);

      const novoQuadro: QuadroNoEstado = {
        id: novoId,
        altura: parseFloat(altura),
        largura: parseFloat(largura),
        moldurasSelecionadas: moldurasDoQuadro,
        materiaisSelecionados: materiaisSelecionados,
        espessuraPaspatur: isPaspaturVisivel
          ? parseFloat(espessuraPaspatur) || 0
          : 0,
        medidaFornecidaCliente: medidaCliente,
        limpezaSelecionada: false,
        valorCalculado: valorTotalItem,
        quantidade: qtd,
        detalhesCalculo: resultado.detalhes,
        acrescimo_cm: parseFloat(acrescimo) || 0,
      };

      console.log("✅ add quadro com ID único:", novoId);
      console.log("📊 quadro criado:", novoQuadro);
      
      setQuadrosDoPedido((prev) => {
        const novaLista = [...prev, novoQuadro];
        console.log("📈 Nova quantidade de quadros:", novaLista.length);
        console.log("📋 IDs agr:", novaLista.map(q => q.id));
        return novaLista;
      });
      
      handleLimparCampos();
    } catch (err) {
      console.error(err);
      alert("Erro ao calcular quadro final.");
    } finally {
      setIsLoading(false);
    }
  }, [formQuadro]);

  // --- ACOES DO PEDIDO ---

  const handleDeleteQuadro = (id: number) => {
    console.log(`🗑️ DELETANDO: Tentando remover quadro ID: ${id}`);
    console.log(`📊 Estado ANTES: ${quadrosDoPedido.length} quadros`);
    console.log(`📋 IDs ANTES:`, quadrosDoPedido.map(q => q.id));

    if (!id || id === 0 || id === null) {
      console.error("❌ ID INVÁLIDO DETECTADO:", id);
      alert("Erro: ID inválido");
      return;
    }

    if (confirm("Remover este quadro do pedido?")) {
      setQuadrosDoPedido((prev) => {
        console.log(`Filtrando lista com ${prev.length} itens...`);
        const novaLista = prev.filter((q) => {
          const deve_manter = q.id !== id;
          console.log(`  - ID ${q.id}: ${deve_manter ? "MANTÉM ✓" : "REMOVE ✗"}`);
          return deve_manter;
        });

        console.log(`📊 Estado DPS: ${novaLista.length} quadros`);
        console.log(`📋 IDs DPS:`, novaLista.map(q => q.id));

        // ALERT se tudo foi deletado acidentalmente
        if (novaLista.length === 0 && prev.length > 1) {
          console.error("CRÍTICO: Todos os quadros foram deletados, verificar IDs duplicados");
        }

        return novaLista;
      });
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

  const valorTotalPedido = quadrosDoPedido.reduce(
    (acc, q) => acc + q.valorCalculado,
    0,
  );

  const handleSalvarPedido = async () => {
    if (quadrosDoPedido.length === 0)
      return alert("Adicione quadros ao pedido.");
    if (!atendente || !cliente) return alert("Preencha Atendente e Cliente.");

    setIsSalvando(true);
    try {
      console.log("Estado atual dos quadros:", JSON.stringify(quadrosDoPedido, null, 2));
      
      const prepararQuadros = (lista: QuadroNoEstado[]) => {
        return lista.map((q, idx) => {
          if (!q) {
            console.warn(`⚠️ Quadro ${idx} está null/undefined!`);
            throw new Error(`Quadro inválido na posição ${idx}`);
          }

          const quadroPronto = {
            id: q.id,
            altura: Number(q.altura),
            largura: Number(q.largura),
            moldurasSelecionadas: Array.isArray(q.moldurasSelecionadas) 
              ? q.moldurasSelecionadas 
              : [],
            materiaisSelecionados: Array.isArray(q.materiaisSelecionados)
              ? q.materiaisSelecionados
              : [],
            espessuraPaspatur: Number(q.espessuraPaspatur) || 0,
            medidaFornecidaCliente: Boolean(q.medidaFornecidaCliente),
            limpezaSelecionada: Boolean(q.limpezaSelecionada),
            valorCalculado: Number(q.valorCalculado),
            acrescimo_cm: q.acrescimo_cm ? Number(q.acrescimo_cm) : 0,
            quantidade: q.quantidade ? Number(q.quantidade) : 1,
          };

      // --------------- LOG DETALHADO DE DEBUG ----------------

          console.log(`✓ Quadro ${idx} preparado:`, quadroPronto);
          return quadroPronto;
        });
      };

      const quadrosParaEnvio = prepararQuadros(quadrosDoPedido);
      
      if (quadrosParaEnvio.length === 0) {
        throw new Error("Nenhum quadro válido para enviar!");
      }

      const todasMoldurasSao = quadrosParaEnvio.every(
        (q) => Array.isArray(q.moldurasSelecionadas) && q.moldurasSelecionadas.length >= 0
      );

      if (!todasMoldurasSao) {
        console.error("❌ Erro: Alguns quadros têm molduras inválidas!");
        throw new Error("Erro interno: Tentativa de salvar quadro com molduras inválidas.");
      }

      console.log("Enviando para API:", JSON.stringify(quadrosParaEnvio, null, 2));

      if (isEditing && pedidoId) {
        const updateDto: PedidoUpdateDto = {
          observacoes,
          condicao_pagamento: condicaoPagamento,
          quadros: quadrosParaEnvio,
          valor_final_calculado: valorTotalPedido,
          valor_final_manual: valorFinalManual ?? undefined,
          ocultar_valores_unitarios: ocultarValoresUnitarios,
        };
        
        console.log("Atualizando pedido:", updateDto);
        await updatePedido(Number(pedidoId), updateDto);
        alert(`Pedido #${numeroPedidoDisplay} atualizado com sucesso!`);
        navigate("/backlog");
      } else {
        const dtoApi: PedidoApiDto = {
          nomeAtendente: atendente,
          nomeCliente: cliente,
          telefoneCliente: telefone,
          observacoes,
          condicao_pagamento: condicaoPagamento,
          quadros: quadrosParaEnvio,
          valor_final_calculado: valorTotalPedido,
          valor_final_manual: valorFinalManual ?? undefined,
          ocultar_valores_unitarios: ocultarValoresUnitarios,
        };

        console.log("Criando novo pedido:", dtoApi);
        const response = await salvarPedido(dtoApi);
        
        if (response.pdf_pedido_url) {
          let urlAbsoluta = response.pdf_pedido_url;
          if (!urlAbsoluta.startsWith("http")) {
            urlAbsoluta = `${API_URL}${urlAbsoluta}`;
          }
          window.open(urlAbsoluta, "_blank");
        } else if (response.pedidoId) {
          try {
            const pdfBase64 = await fetchPdfBase64(response.pedidoId, "pdf");
            const blob = b64toBlob(pdfBase64, "application/pdf");
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
          } catch (e) {
            console.error("Erro ao abrir PDF pós-salvamento", e);
          }
        }

        alert(`Pedido #${response.numeroPedido} salvo com sucesso!`);
        
      }
    } catch (err) {
      console.error("❌ erro completo:", err);
      
      if (axios.isAxiosError(err) && err.response?.data) {
        const errorData = err.response.data as Record<string, unknown>;
        const errorMsg = (errorData.message as string) || 
                        JSON.stringify(err.response.data);
        alert(`Erro ao salvar pedido:\n${errorMsg}`);
      } else if (err instanceof Error) {
        alert(`Erro ao salvar pedido: ${err.message}`);
      } else {
        alert("Erro ao salvar pedido. Verifique o console.");
      }
    } finally {
      setIsSalvando(false);
    }
  };

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
    return (
      <div className="page-content">
        <div className="container">Carregando sistema...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-content">
        <div className="container text-danger">{error}</div>
      </div>
    );
  }
  return (
    <div className="page-content">
      <div className="container">
        <h1 className="page-title">
          {isEditing ? `Editando Pedido #${numeroPedidoDisplay}` : "Novo Orçamento"}
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
          quantidade={formQuadro.quantidade}
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
          onAcrescimoChange={(v) =>
            setFormQuadro((f) => ({ ...f, acrescimo: v }))
          }
          onLimparCampos={handleLimparCampos}
          onAdicionarQuadro={handleAdicionarQuadro}
          condicaoPagamento={condicaoPagamento}
          onCondicaoPagamentoChange={setCondicaoPagamento}
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
