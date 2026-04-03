import { useEffect, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import type { TagValueUpdate } from '../types'

export type SignalRStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseSignalRReturn {
  status: SignalRStatus
  lastUpdate: TagValueUpdate | null
  updates: Map<number, TagValueUpdate>
}

export function useSignalR(): UseSignalRReturn {
  const [status, setStatus] = useState<SignalRStatus>('connecting')
  const [lastUpdate, setLastUpdate] = useState<TagValueUpdate | null>(null)
  const [updates, setUpdates] = useState<Map<number, TagValueUpdate>>(new Map())
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/opc-data')
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connectionRef.current = connection

    connection.onreconnecting(() => setStatus('connecting'))
    connection.onreconnected(() => setStatus('connected'))
    connection.onclose(() => setStatus('disconnected'))

    connection.on('tagValueUpdated', (update: TagValueUpdate) => {
      setLastUpdate(update)
      setUpdates(prev => new Map(prev).set(update.tagId, update))
    })

    connection
      .start()
      .then(() => setStatus('connected'))
      .catch(() => setStatus('error'))

    return () => {
      connection.stop()
    }
  }, [])

  return { status, lastUpdate, updates }
}
