import { useState, useEffect } from 'react'

/** Returns true when at least one gamepad is connected. */
export function useGamepad(): boolean {
  const [connected, setConnected] = useState(() =>
    Array.from(navigator.getGamepads()).some(Boolean)
  )
  useEffect(() => {
    const onConnect = () => setConnected(true)
    const onDisconnect = () =>
      setConnected(Array.from(navigator.getGamepads()).some(Boolean))
    window.addEventListener('gamepadconnected', onConnect)
    window.addEventListener('gamepaddisconnected', onDisconnect)
    return () => {
      window.removeEventListener('gamepadconnected', onConnect)
      window.removeEventListener('gamepaddisconnected', onDisconnect)
    }
  }, [])
  return connected
}
