import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Zap, Bell, Lightbulb, Volume2, VolumeX, RotateCw, Moon, Sun } from 'lucide-react';

const Dashboard = () => {
  const [vibrations, setVibrations] = useState([]);
  const [totalVibrations, setTotalVibrations] = useState(0);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [ledStatus, setLedStatus] = useState(false);
  const [buzzerStatus, setBuzzerStatus] = useState(false);
  const [client, setClient] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js';
    script.async = true;
    script.onload = () => {
      connectMQTT();
    };
    document.body.appendChild(script);

    return () => {
      if (client) {
        client.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectMQTT = () => {
    try {
      const mqttClient = new window.Paho.MQTT.Client(
        'befdaf08.ala.us-east-1.emqxsl.com',
        8084,
        'clientId_' + Math.random().toString(16).substr(2, 8)
      );

      mqttClient.onConnectionLost = (responseObject) => {
        if (responseObject.errorCode !== 0) {
          console.log('Conexión perdida:', responseObject.errorMessage);
          setMqttConnected(false);
          setTimeout(connectMQTT, 5000);
        }
      };

      mqttClient.onMessageArrived = (message) => {
        console.log('Mensaje recibido:', message.payloadString);
        const topic = message.destinationName;
        const payload = message.payloadString;

        if (topic === '2023171035/evaluacion2') {
          try {
            const data = JSON.parse(payload);
            if (data.event === 'vibration') {
              const newVibration = {
                count: data.count,
                timestamp: data.timestamp,
                time: new Date().toLocaleTimeString()
              };
              setVibrations(prev => [newVibration, ...prev].slice(0, 10));
              setTotalVibrations(data.count);
              setLastEvent(newVibration);
            }
          } catch (e) {
            console.error('Error parseando JSON:', e);
          }
        }
      };

      const options = {
        useSSL: true,
        userName: 'pepito',
        password: 'Fiyupanzona20',
        onSuccess: () => {
          console.log('Conectado a MQTT');
          setMqttConnected(true);
          mqttClient.subscribe('2023171035/evaluacion2');
          mqttClient.subscribe('befdaf08/esp32/led/status');
          mqttClient.subscribe('befdaf08/esp32/buzzer/status');
        },
        onFailure: (error) => {
          console.error('Error de conexión:', error);
          setMqttConnected(false);
          setTimeout(connectMQTT, 5000);
        }
      };

      mqttClient.connect(options);
      setClient(mqttClient);
    } catch (error) {
      console.error('Error creando cliente MQTT:', error);
    }
  };

  const publishMessage = (topic, message) => {
    if (client && mqttConnected) {
      const mqttMessage = new window.Paho.MQTT.Message(message);
      mqttMessage.destinationName = topic;
      client.send(mqttMessage);
    }
  };

  const toggleLed = () => {
    const newStatus = !ledStatus;
    publishMessage('befdaf08/esp32/led/set', newStatus ? '1' : '0');
    setLedStatus(newStatus);
  };

  const toggleBuzzer = () => {
    const newStatus = !buzzerStatus;
    publishMessage('befdaf08/esp32/buzzer/set', newStatus ? '1' : '0');
    setBuzzerStatus(newStatus);
  };

  const triggerOTA = () => {
    if (window.confirm('¿Iniciar actualización OTA? El dispositivo se reiniciará.')) {
      publishMessage('befdaf08/esp32/ota/update', '1');
    }
  };

  // Colores según tema
  const colors = {
    bg: darkMode ? '#111827' : '#ffffff',
    text: darkMode ? '#f9fafb' : '#111827',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    cardBg: darkMode ? '#1f2937' : '#ffffff',
    primary: '#3b82f6',
    success: darkMode ? '#10b981' : '#059669',
    successBg: darkMode ? '#064e3b' : '#d1fae5',
    warning: darkMode ? '#f59e0b' : '#d97706',
    warningBg: darkMode ? '#78350f' : '#fffbeb',
    danger: darkMode ? '#ef4444' : '#dc2626',
    dangerBg: darkMode ? '#7f1d1d' : '#fee2e2',
    info: darkMode ? '#06b6d4' : '#0891b2',
    infoBg: darkMode ? '#164e63' : '#ecfeff'
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: colors.bg,
      color: colors.text,
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{
          borderBottom: `2px solid ${colors.primary}`,
          paddingBottom: '20px',
          marginBottom: '40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: colors.text,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Activity color={colors.primary} size={32} aria-hidden="true" />
                ESP32 SW-420 Dashboard
              </h1>
              <p style={{ color: colors.textSecondary, marginTop: '4px', fontSize: '16px', margin: '4px 0 0 0' }}>
                Monitor y control del sistema
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Botón tema */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                aria-label={darkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: `2px solid ${colors.border}`,
                  background: colors.cardBg,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: '44px',
                  minHeight: '44px',
                  justifyContent: 'center'
                }}
              >
                {darkMode ? <Sun size={20} color={colors.text} /> : <Moon size={20} color={colors.text} />}
              </button>
              
              {/* Estado conexión */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '20px',
                background: mqttConnected ? colors.successBg : colors.dangerBg,
                color: mqttConnected ? colors.success : colors.danger,
                fontSize: '15px',
                fontWeight: '500',
                minHeight: '44px'
              }}
              role="status"
              aria-live="polite">
                {mqttConnected ? <Wifi size={18} aria-hidden="true" /> : <WifiOff size={18} aria-hidden="true" />}
                <span>{mqttConnected ? 'Conectado' : 'Desconectado'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{ 
            padding: '24px', 
            border: `2px solid ${colors.primary}`, 
            borderRadius: '12px',
            background: colors.cardBg
          }}>
            <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0, fontWeight: '500' }}>
              Total Vibraciones
            </p>
            <p style={{ fontSize: '36px', fontWeight: '700', color: colors.text, margin: '8px 0 0 0' }}>
              {totalVibrations}
            </p>
          </div>

          <div style={{ 
            padding: '24px', 
            border: `2px solid #8b5cf6`, 
            borderRadius: '12px',
            background: colors.cardBg
          }}>
            <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0, fontWeight: '500' }}>
              Último Evento
            </p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: colors.text, margin: '8px 0 0 0' }}>
              {lastEvent ? lastEvent.time : '—'}
            </p>
          </div>

          <div style={{ 
            padding: '24px', 
            border: `2px solid ${colors.success}`, 
            borderRadius: '12px',
            background: colors.cardBg
          }}>
            <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0, fontWeight: '500' }}>
              Estado
            </p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: colors.text, margin: '8px 0 0 0' }}>
              {mqttConnected ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{ 
            padding: '24px', 
            border: `2px solid ${colors.warning}`, 
            borderRadius: '12px',
            background: colors.cardBg
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: colors.text,
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Lightbulb size={18} color={colors.warning} aria-hidden="true" />
              Control LED Externo
            </h2>
            <button
              onClick={toggleLed}
              disabled={!mqttConnected}
              aria-label={ledStatus ? 'Apagar LED' : 'Encender LED'}
              aria-pressed={ledStatus}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                cursor: mqttConnected ? 'pointer' : 'not-allowed',
                background: ledStatus ? colors.warning : colors.border,
                color: ledStatus ? 'white' : colors.text,
                opacity: mqttConnected ? 1 : 0.5,
                transition: 'all 0.2s',
                minHeight: '48px'
              }}
            >
              {ledStatus ? '💡 Encendido' : 'Apagado'}
            </button>
          </div>

          <div style={{ 
            padding: '24px', 
            border: `2px solid #f97316`, 
            borderRadius: '12px',
            background: colors.cardBg
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: colors.text,
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {buzzerStatus ? <Volume2 size={18} color="#f97316" aria-hidden="true" /> : <VolumeX size={18} color="#f97316" aria-hidden="true" />}
              Control Buzzer
            </h2>
            <button
              onClick={toggleBuzzer}
              disabled={!mqttConnected}
              aria-label={buzzerStatus ? 'Desactivar buzzer' : 'Activar buzzer'}
              aria-pressed={buzzerStatus}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                cursor: mqttConnected ? 'pointer' : 'not-allowed',
                background: buzzerStatus ? '#f97316' : colors.border,
                color: buzzerStatus ? 'white' : colors.text,
                opacity: mqttConnected ? 1 : 0.5,
                transition: 'all 0.2s',
                minHeight: '48px'
              }}
            >
              {buzzerStatus ? '🔊 Activo' : 'Inactivo'}
            </button>
          </div>
        </div>

        {/* OTA */}
        <div style={{
          padding: '24px',
          border: `2px solid #6366f1`,
          borderRadius: '12px',
          marginBottom: '40px',
          background: colors.cardBg
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: colors.text,
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <RotateCw size={18} color="#6366f1" aria-hidden="true" />
            Actualización OTA
          </h2>
          <button
            onClick={triggerOTA}
            disabled={!mqttConnected}
            aria-label="Iniciar actualización de firmware OTA"
            style={{
              padding: '14px 24px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: mqttConnected ? 'pointer' : 'not-allowed',
              background: '#6366f1',
              color: 'white',
              opacity: mqttConnected ? 1 : 0.5,
              transition: 'all 0.2s',
              minHeight: '48px'
            }}
          >
            Iniciar actualización
          </button>
        </div>

        {/* History */}
        <div style={{
          padding: '24px',
          border: `2px solid ${colors.info}`,
          borderRadius: '12px',
          background: colors.cardBg
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: colors.text,
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Bell size={18} color={colors.info} aria-hidden="true" />
            Historial de Vibraciones
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} role="log" aria-live="polite">
            {vibrations.length === 0 ? (
              <p style={{
                color: colors.textSecondary,
                textAlign: 'center',
                padding: '24px 0',
                margin: 0,
                fontSize: '15px'
              }}>
                Sin eventos registrados
              </p>
            ) : (
              vibrations.map((vib, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '15px',
                    background: colors.cardBg
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      background: colors.infoBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Zap size={18} color={colors.info} aria-hidden="true" />
                    </div>
                    <div>
                      <span style={{ color: colors.text, fontWeight: '600' }}>
                        Vibración #{vib.count}
                      </span>
                      <span style={{ color: colors.textSecondary, marginLeft: '10px', fontSize: '14px' }}>
                        {vib.timestamp} ms
                      </span>
                    </div>
                  </div>
                  <time style={{ 
                    color: colors.textSecondary, 
                    fontFamily: 'monospace', 
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {vib.time}
                  </time>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;