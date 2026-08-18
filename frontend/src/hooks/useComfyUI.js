import { useState, useEffect, useRef, useCallback } from 'react';
import baseWorkflow from '../assets/workflow.json';

const CLIENT_ID = crypto.randomUUID();
const COMFY_WS_URL = `ws://127.0.0.1:8188/ws?clientId=${CLIENT_ID}`;

const KSAMPLER_IDS = ['115:3', '142:138', '160:156'];
const SAVE_NODE_MAP = {
  '60': 'front',
  '179': 'side',
  '180': 'iso',
};
const KSAMPLER_LABELS = {
  '115:3': '⚡ Ön görünüm üretiliyor...',
  '142:138': '⚡ Yan profil üretiliyor...',
  '160:156': '⚡ İzometrik görünüm üretiliyor...',
};

function buildWorkflow(imageName, settings) {
  const w = JSON.parse(JSON.stringify(baseWorkflow));

  // Input image
  w['78'].inputs.image = imageName;

  // Megapixels — 3 scaler nodes
  ['115:93', '142:137', '160:155'].forEach(id => {
    w[id].inputs.megapixels = settings.megapixels;
  });

  // LoRA strength — 3 LoRA nodes
  ['115:89', '142:141', '160:159'].forEach(id => {
    w[id].inputs.strength_model = settings.loraStrength;
  });

  // CFGNorm — 3 nodes
  ['115:75', '142:125', '160:143'].forEach(id => {
    w[id].inputs.strength = settings.cfgNorm;
  });

  // Steps and seed — 3 KSamplers
  const samplers = ['115:3', '142:138', '160:156'];
  samplers.forEach((id, idx) => {
    w[id].inputs.steps = settings.steps;
    if (settings.randomSeed) {
      w[id].inputs.seed = Math.floor(Math.random() * 9999999999999);
    } else {
      w[id].inputs.seed = settings.seeds[idx];
    }
  });

  // Positive prompts
  w['115:111'].inputs.prompt = settings.prompts.front.positive;
  w['142:133'].inputs.prompt = settings.prompts.side.positive;
  w['160:151'].inputs.prompt = settings.prompts.iso.positive;

  // Negative prompts
  w['115:110'].inputs.prompt = settings.prompts.front.negative;
  w['142:129'].inputs.prompt = settings.prompts.side.negative;
  w['160:147'].inputs.prompt = settings.prompts.iso.negative;

  return w;
}

function timestamp() {
  return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function useComfyUI() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPromptId, setCurrentPromptId] = useState(null);
  const [progress, setProgress] = useState({
    completedSteps: 0,
    totalSteps: 12,
    percent: 0,
    activeNodeId: null,
    activeNodeLabel: '',
    phase: 'idle',
  });
  const [outputs, setOutputs] = useState({ front: null, side: null, iso: null });
  const [logs, setLogs] = useState([]);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const timeoutTimerRef = useRef(null);
  const promptIdRef = useRef(null);
  const completedStepsRef = useRef(0);
  const currentKSamplerIndexRef = useRef(-1);

  const addLog = useCallback((message, type = 'info') => {
    setLogs(prev => [...prev, { time: timestamp(), message, type }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const clearOutputs = useCallback(() => {
    setOutputs({ front: null, side: null, iso: null });
  }, []);

  // Reset timeout whenever progress happens
  const resetTimeout = useCallback(() => {
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    timeoutTimerRef.current = setTimeout(() => {
      addLog('İşlem yanıt vermiyor. ComfyUI\'yı kontrol edin.', 'warn');
    }, 45000);
  }, [addLog]);

  const clearTimeoutTimer = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  // WebSocket message handler
  const handleWSMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.data);
      const { type, data } = msg;

      // Filter by prompt_id if we have one active
      if (data?.prompt_id && promptIdRef.current && data.prompt_id !== promptIdRef.current) {
        return;
      }

      switch (type) {
        case 'status': {
          const queueRemaining = data?.status?.exec_info?.queue_remaining ?? 0;
          if (queueRemaining === 0 && !promptIdRef.current) {
            // Nothing in queue
          }
          break;
        }

        case 'execution_start': {
          if (data.prompt_id === promptIdRef.current) {
            addLog(`▶ Job başladı: ${data.prompt_id.slice(0, 8)}...`, 'info');
            setProgress(prev => ({ ...prev, phase: 'running' }));
            resetTimeout();
          }
          break;
        }

        case 'executing': {
          if (data.prompt_id !== promptIdRef.current) break;

          if (data.node === null) {
            // Job complete
            setProgress(prev => ({
              ...prev,
              completedSteps: prev.totalSteps,
              percent: 100,
              phase: 'done',
              activeNodeLabel: '✅ Tüm görseller hazır!',
            }));
            setIsRunning(false);
            promptIdRef.current = null;
            completedStepsRef.current = 0;
            currentKSamplerIndexRef.current = -1;
            clearTimeoutTimer();
            addLog('✓ Tüm görseller tamamlandı', 'success');
          } else {
            // A node started executing
            const nodeId = data.node;
            const ksIdx = KSAMPLER_IDS.indexOf(nodeId);
            if (ksIdx !== -1) {
              currentKSamplerIndexRef.current = ksIdx;
              const label = KSAMPLER_LABELS[nodeId] || '🔄 Model hazırlanıyor...';
              setProgress(prev => ({
                ...prev,
                activeNodeId: nodeId,
                activeNodeLabel: label,
              }));
              addLog(`⚡ ${label}`, 'progress');
            } else {
              // Other node
              const meta = baseWorkflow[nodeId]?._meta?.title || nodeId;
              setProgress(prev => ({
                ...prev,
                activeNodeId: nodeId,
                activeNodeLabel: KSAMPLER_LABELS[prev.activeNodeId] || '🔄 Model hazırlanıyor...',
              }));
              addLog(`⚙ Node ${nodeId} çalışıyor: ${meta}`, 'info');
            }
            resetTimeout();
          }
          break;
        }

        case 'progress': {
          if (data.prompt_id !== promptIdRef.current) break;
          const ksIdx = KSAMPLER_IDS.indexOf(data.node);
          const baseSteps = ksIdx >= 0 ? ksIdx * data.max : 0;
          const completed = baseSteps + data.value;
          completedStepsRef.current = completed;
          const totalSteps = KSAMPLER_IDS.length * data.max;

          setProgress(prev => ({
            ...prev,
            completedSteps: completed,
            totalSteps,
            percent: Math.round((completed / totalSteps) * 100),
            activeNodeId: data.node,
            activeNodeLabel: KSAMPLER_LABELS[data.node] || prev.activeNodeLabel,
          }));

          addLog(`⚡ KSampler (${KSAMPLER_LABELS[data.node]?.replace('⚡ ', '') || data.node}) — Adım ${data.value}/${data.max}`, 'progress');
          resetTimeout();
          break;
        }

        case 'executed': {
          if (data.prompt_id !== promptIdRef.current) break;
          const viewKey = SAVE_NODE_MAP[data.node];
          if (viewKey && data.output?.images?.[0]) {
            const img = data.output.images[0];
            const url = `/api/view?filename=${encodeURIComponent(img.filename)}&type=output&subfolder=`;
            setOutputs(prev => ({
              ...prev,
              [viewKey]: { filename: img.filename, url }
            }));
            const viewNames = { front: 'Ön görünüm', side: 'Yan profil', iso: 'İzometrik' };
            addLog(`✓ ${viewNames[viewKey]} kaydedildi: ${img.filename}`, 'success');
          }
          resetTimeout();
          break;
        }

        case 'execution_error': {
          if (data.prompt_id !== promptIdRef.current) break;
          setProgress(prev => ({ ...prev, phase: 'error', activeNodeLabel: '❌ Hata oluştu' }));
          setIsRunning(false);
          promptIdRef.current = null;
          clearTimeoutTimer();
          addLog(`❌ Hata: ${data.exception_message || 'Bilinmeyen hata'} (Node: ${data.node_id || '?'})`, 'error');
          break;
        }

        default:
          break;
      }
    } catch (e) {
      // Binary message (preview image data), ignore
    }
  }, [addLog, resetTimeout, clearTimeoutTimer]);

  // WebSocket connection management
  const connectWS = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const ws = new WebSocket(COMFY_WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        addLog('ℹ ComfyUI\'ya bağlandı', 'success');
        if (reconnectTimerRef.current) {
          clearInterval(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setInterval(() => {
            connectWS();
          }, 3000);
        }
      };

      ws.onerror = () => {
        setConnectionError('ComfyUI\'ya bağlanılamıyor');
        setIsConnected(false);
      };

      ws.onmessage = handleWSMessage;
      wsRef.current = ws;
    } catch (e) {
      setConnectionError('WebSocket bağlantı hatası');
    }
  }, [handleWSMessage, addLog]);

  useEffect(() => {
    connectWS();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
      }
      clearTimeoutTimer();
    };
  }, [connectWS, clearTimeoutTimer]);

  // Run generation
  const runGeneration = useCallback(async (imageFile, settings) => {
    // Reset outputs
    setOutputs({ front: null, side: null, iso: null });
    setIsRunning(true);
    completedStepsRef.current = 0;
    currentKSamplerIndexRef.current = -1;

    const totalSteps = KSAMPLER_IDS.length * settings.steps;
    setProgress({
      completedSteps: 0,
      totalSteps,
      percent: 0,
      activeNodeId: null,
      activeNodeLabel: 'Görsel yükleniyor...',
      phase: 'uploading',
    });

    try {
      // 1. Upload image
      addLog(`↑ Görsel yükleniyor: ${imageFile.name} (${(imageFile.size / (1024 * 1024)).toFixed(1)} MB)`, 'info');
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('overwrite', 'true');

      const uploadRes = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error(`Görsel yüklenemedi: HTTP ${uploadRes.status}`);
      }

      const uploadData = await uploadRes.json();
      const imageName = uploadData.name;
      addLog(`✓ Görsel yüklendi: ${imageName}`, 'success');

      // 2. Build workflow
      const workflow = buildWorkflow(imageName, settings);

      // 3. Queue prompt
      setProgress(prev => ({ ...prev, phase: 'queued', activeNodeLabel: 'Kuyrukta bekliyor...' }));
      addLog('▶ Job kuyruğa ekleniyor...', 'info');

      const promptRes = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          prompt: workflow,
        }),
      });

      if (!promptRes.ok) {
        throw new Error(`Prompt kuyruğa eklenemedi: HTTP ${promptRes.status}`);
      }

      const promptData = await promptRes.json();

      // Check node errors
      if (promptData.node_errors && Object.keys(promptData.node_errors).length > 0) {
        const errorNodes = Object.entries(promptData.node_errors)
          .map(([id, err]) => `Node ${id}: ${JSON.stringify(err)}`)
          .join('; ');
        throw new Error(`Node hataları: ${errorNodes}`);
      }

      const promptId = promptData.prompt_id;
      setCurrentPromptId(promptId);
      promptIdRef.current = promptId;
      addLog(`▶ Job kuyruğa eklendi: ${promptId.slice(0, 8)}...`, 'success');

      // Start timeout
      resetTimeout();

    } catch (error) {
      setProgress(prev => ({ ...prev, phase: 'error', activeNodeLabel: '❌ Hata oluştu' }));
      setIsRunning(false);
      addLog(`❌ ${error.message}`, 'error');
    }
  }, [addLog, resetTimeout]);

  // Cancel job
  const cancelJob = useCallback(async () => {
    try {
      await fetch('/api/interrupt', { method: 'POST' });
      setIsRunning(false);
      setProgress(prev => ({ ...prev, phase: 'idle', activeNodeLabel: '' }));
      promptIdRef.current = null;
      clearTimeoutTimer();
      addLog('■ İş iptal edildi', 'warn');
    } catch (e) {
      addLog(`❌ İptal hatası: ${e.message}`, 'error');
    }
  }, [addLog, clearTimeoutTimer]);

  // Test connection
  const testConnection = useCallback(async () => {
    try {
      const res = await fetch('/api/system_stats');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const gpuName = data?.system?.devices?.[0]?.name || 'Bilinmiyor';
      addLog(`✅ Bağlantı başarılı — GPU: ${gpuName}`, 'success');
      return true;
    } catch (e) {
      addLog('❌ Bağlanamadı', 'error');
      return false;
    }
  }, [addLog]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    wsRef.current = null;
    setConnectionError(null);
    setTimeout(() => connectWS(), 100);
  }, [connectWS]);

  return {
    isConnected,
    connectionError,
    isRunning,
    currentPromptId,
    progress,
    outputs,
    logs,
    runGeneration,
    cancelJob,
    clearOutputs,
    clearLogs,
    testConnection,
    reconnect,
  };
}
