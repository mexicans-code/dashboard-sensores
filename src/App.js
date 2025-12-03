import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Zap, Bell, Lightbulb, Volume2, VolumeX, RotateCw } from 'lucide-react';

const Dashboard = () => {
  const [vibrations, setVibrations] = useState([]);
  const [totalVibrations, setTotalVibrations] = useState(0);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [ledStatus, setLedStatus] = useState(false);
  const [buzzerStatus, setBuzzerStatus] = useState(false);
  const [client, setClient] = useState(null);

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

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{
          borderBottom: '2px solid #3b82f6',
          paddingBottom: '20px',
          marginBottom: '40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#1e40af',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Activity color="#3b82f6" size={32} />
                ESP32 SW-420 Dashboard
              </h1>
              <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px', margin: '4px 0 0 0' }}>
                Monitor y control del sistema
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '20px',
              background: mqttConnected ? '#d1fae5' : '#fee2e2',
              color: mqttConnected ? '#059669' : '#dc2626',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {mqttConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
              <span>{mqttConnected ? 'Conectado' : 'Desconectado'}</span>
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
            border: '2px solid #3b82f6', 
            borderRadius: '12px',
            background: '#eff6ff'
          }}>
            <p style={{ color: '#1e40af', fontSize: '13px', margin: 0, fontWeight: '500' }}>Total Vibraciones</p>
            <p style={{ fontSize: '36px', fontWeight: '700', color: '#1e3a8a', margin: '8px 0 0 0' }}>
              {totalVibrations}
            </p>
          </div>

          <div style={{ 
            padding: '24px', 
            border: '2px solid #8b5cf6', 
            borderRadius: '12px',
            background: '#f5f3ff'
          }}>
            <p style={{ color: '#6d28d9', fontSize: '13px', margin: 0, fontWeight: '500' }}>Último Evento</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#5b21b6', margin: '8px 0 0 0' }}>
              {lastEvent ? lastEvent.time : '—'}
            </p>
          </div>

          <div style={{ 
            padding: '24px', 
            border: '2px solid #10b981', 
            borderRadius: '12px',
            background: '#d1fae5'
          }}>
            <p style={{ color: '#047857', fontSize: '13px', margin: 0, fontWeight: '500' }}>Estado</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#065f46', margin: '8px 0 0 0' }}>
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
            border: '2px solid #f59e0b', 
            borderRadius: '12px',
            background: '#fffbeb'
          }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#92400e',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Lightbulb size={18} color="#f59e0b" />
              LED Externo
            </h3>
            <button
              onClick={toggleLed}
              disabled={!mqttConnected}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: mqttConnected ? 'pointer' : 'not-allowed',
                background: ledStatus ? '#f59e0b' : '#e5e7eb',
                color: ledStatus ? 'white' : '#6b7280',
                opacity: mqttConnected ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
            >
              {ledStatus ? '💡 Encendido' : 'Apagado'}
            </button>
          </div>

          <div style={{ 
            padding: '24px', 
            border: '2px solid #f97316', 
            borderRadius: '12px',
            background: '#fff7ed'
          }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#9a3412',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {buzzerStatus ? <Volume2 size={18} color="#f97316" /> : <VolumeX size={18} color="#f97316" />}
              Buzzer
            </h3>
            <button
              onClick={toggleBuzzer}
              disabled={!mqttConnected}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: mqttConnected ? 'pointer' : 'not-allowed',
                background: buzzerStatus ? '#f97316' : '#e5e7eb',
                color: buzzerStatus ? 'white' : '#6b7280',
                opacity: mqttConnected ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
            >
              {buzzerStatus ? '🔊 Activo' : 'Inactivo'}
            </button>
          </div>
        </div>

        {/* OTA */}
        <div style={{
          padding: '24px',
          border: '2px solid #6366f1',
          borderRadius: '12px',
          marginBottom: '40px',
          background: '#eef2ff'
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#4338ca',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <RotateCw size={18} color="#6366f1" />
            Actualización OTA
          </h3>
          <button
            onClick={triggerOTA}
            disabled={!mqttConnected}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: mqttConnected ? 'pointer' : 'not-allowed',
              background: '#6366f1',
              color: 'white',
              opacity: mqttConnected ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
          >
            Iniciar actualización
          </button>
        </div>

        {/* History */}
        <div style={{
          padding: '24px',
          border: '2px solid #06b6d4',
          borderRadius: '12px',
          background: '#ecfeff'
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#0e7490',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Bell size={18} color="#06b6d4" />
            Historial de Vibraciones
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {vibrations.length === 0 ? (
              <p style={{
                color: '#9ca3af',
                textAlign: 'center',
                padding: '24px 0',
                margin: 0,
                fontSize: '14px'
              }}>
                Sin eventos registrados
              </p>
            ) : (
              vibrations.map((vib, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    border: '1px solid #cffafe',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: '#cffafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Zap size={16} color="#0891b2" />
                    </div>
                    <div>
                      <span style={{ color: '#0e7490', fontWeight: '600' }}>
                        Vibración #{vib.count}
                      </span>
                      <span style={{ color: '#9ca3af', marginLeft: '10px', fontSize: '13px' }}>
                        {vib.timestamp} ms
                      </span>
                    </div>
                  </div>
                  <span style={{ 
                    color: '#0891b2', 
                    fontFamily: 'monospace', 
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    {vib.time}
                  </span>
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