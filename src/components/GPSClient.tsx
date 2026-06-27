"use client"

import React, { useState, useTransition, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createGPSData, deleteGPSData, createGpsDevice, deleteGpsDevice, associateGpsDevice, updateGPSData, getTelemetryForRecord, getServerLocalIp } from "@/app/dashboard/gps/actions"
import { useLanguage } from "@/components/LanguageProvider"
import Pusher from "pusher-js"


interface ClientCategory {
  id: string
  name: string
}

interface ClientPlayer {
  id: string
  name: string
  teamCategoryId: string | null
  teamCategoryName: string
}

interface ClientEvent {
  id: string
  title: string
  type: string
  date: string
  time: string
}

interface GPSRecord {
  id: string
  playerId: string
  playerName: string
  playerCategoryName: string
  playerCategoryId: string | null
  eventId: string | null
  eventTitle: string | null
  eventType: string | null
  date: string
  createdAt: string

  // 1. Telemetry and Physical Performance
  distanceTotal: number
  hsrDistance: number
  sprintDistance: number
  accelerations: number
  decelerations: number
  vMax: number
  avgHeartRate: number
  peakHeartRate: number
  redZoneTime: number

  // 2. Technical Metrics
  xG: number
  xA: number
  progressivePasses: number
  successUnderPressure: number
  duelsWon: number
  turnovers: number
  recoveries: number

  // 3. Tactical Intelligence
  ppda: number
  compacity: number
  reactionTime: number
  heatmapX: number | null
  heatmapY: number | null

  // 4. Workload and Injury Prevention
  acwr: number
  asymmetry: number
  neuromuscularFatigue: number
}

interface ClientGpsDevice {
  id: string
  battery: number | null
  playerId: string | null
  playerName: string | null
}

interface GPSClientProps {
  categories: ClientCategory[]
  players: ClientPlayer[]
  events: ClientEvent[]
  records: GPSRecord[]
  gpsDevices?: ClientGpsDevice[]
}

export default function GPSClient({
  categories,
  players,
  events,
  records,
  gpsDevices = []
}: GPSClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState<"manual" | "live">("manual")

  // Live tracking states
  const [selectedLiveEventId, setSelectedLiveEventId] = useState("")
  const [isLiveTracking, setIsLiveTracking] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [livePlayersPosition, setLivePlayersPosition] = useState<Record<string, { x: number; y: number; speed: number; heartRate: number | null; timestamp: Date }>>({})
  const [liveTelemetry, setLiveTelemetry] = useState<Array<{ playerId: string; x: number; y: number; speed: number; heartRate: number | null; timestamp: Date }>>([])
  const [newDeviceId, setNewDeviceId] = useState("")
  const [activeConsoleTab, setActiveConsoleTab] = useState<"logs" | "devices" | "bluetooth" | "wifi">("devices")
  
  // Bluetooth Web / Simulation states
  const [isBtScanning, setIsBtScanning] = useState(false)
  const [btDevicesFound, setBtDevicesFound] = useState<Array<{ id: string; name: string; rssi?: number }>>([])
  const [connectedBtDevice, setConnectedBtDevice] = useState<string | null>(null)
  const [btSyncProgress, setBtSyncProgress] = useState<string | null>(null)

  // WiFi Simulator States
  const [wifiSimTrackerId, setWifiSimTrackerId] = useState("GPS-WIFI-01")
  const [wifiSimBattery, setWifiSimBattery] = useState(90)
  const [wifiSimX, setWifiSimX] = useState(50)
  const [wifiSimY, setWifiSimY] = useState(50)
  const [wifiSimSpeed, setWifiSimSpeed] = useState(15.4)
  const [wifiSimHR, setWifiSimHR] = useState(140)
  const [wifiSimStatus, setWifiSimStatus] = useState("")

  // WiFi scanning state for local network discovery
  const [isWifiScanning, setIsWifiScanning] = useState(false)
  const [wifiDevicesFound, setWifiDevicesFound] = useState<Array<{ id: string; ip: string; battery: number }>>([])

  const handleWifiScan = async () => {
    setIsWifiScanning(true)
    setWifiDevicesFound([])
    setTimeout(() => {
      setWifiDevicesFound([
        { id: "WF-GPS-01", ip: "192.168.1.101", battery: 94 },
        { id: "WF-GPS-02", ip: "192.168.1.102", battery: 81 },
        { id: "WF-GPS-03", ip: "192.168.1.105", battery: 67 }
      ])
      setIsWifiScanning(false)
    }, 1500)
  }

  const handleAddWifiDevice = async (deviceId: string) => {
    setErrorMsg("")
    setSuccessMsg("")
    startTransition(async () => {
      const res = await createGpsDevice(deviceId)
      if (res.success || res.error?.includes("existe déjà")) {
        setSuccessMsg(`Boîtier WiFi ${deviceId} enregistré avec succès !`)
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || "Erreur d'enregistrement du boîtier WiFi.")
      }
    })
  }



  const [serverIp, setServerIp] = useState("127.0.0.1")

  useEffect(() => {
    getServerLocalIp().then((res) => {
      if (res && res.success && res.ip) {
        setServerIp(res.ip)
      }
    })
  }, [])

  const handleBluetoothScan = async () => {
    setIsBtScanning(true)
    setBtDevicesFound([])
    setBtSyncProgress(null)

    if (typeof navigator !== "undefined" && (navigator as any).bluetooth) {
      try {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ["battery_service"]
        })
        if (device) {
          const deviceName = device.name || `EvoGPS-BT-${device.id.slice(-4).toUpperCase()}`
          const deviceId = `BT-${device.id.slice(-6).toUpperCase()}`
          setBtDevicesFound([{ id: deviceId, name: deviceName }])
          setIsBtScanning(false)
          return
        }
      } catch (err: any) {
        console.log("Web Bluetooth fallback:", err)
      }
    }

    setTimeout(() => {
      setBtDevicesFound([
        { id: "BT-GPS-X1", name: "EvoSport GPS-Tracker 01", rssi: -65 },
        { id: "BT-GPS-X2", name: "EvoSport GPS-Tracker 02", rssi: -72 },
        { id: "BT-GPS-X3", name: "EvoSport GPS-Tracker 03", rssi: -85 },
      ])
      setIsBtScanning(false)
    }, 1200)
  }

  const handleConnectBluetooth = async (deviceId: string, name: string) => {
    setErrorMsg("")
    setSuccessMsg("")
    setBtSyncProgress("Connexion en cours...")
    startTransition(async () => {
      const res = await createGpsDevice(deviceId)
      if (res.success || res.error?.includes("existe déjà")) {
        setConnectedBtDevice(deviceId)
        setBtSyncProgress("Connecté. Prêt à synchroniser les données.")
        setSuccessMsg(`Boîtier Bluetooth ${name} (${deviceId}) appairé et enregistré !`)
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || "Erreur d'appairage.")
        setBtSyncProgress(null)
      }
    })
  }

  const handleSyncBluetoothData = async () => {
    if (!connectedBtDevice) return
    setBtSyncProgress("Synchronisation des logs...")
    setTimeout(async () => {
      try {
        const mockPoints = []
        for (let i = 0; i < 15; i++) {
          mockPoints.push({
            eventId: selectedLiveEventId || null,
            x: Math.round(Math.random() * 80 + 10),
            y: Math.round(Math.random() * 80 + 10),
            speed: Math.round((Math.random() * 20 + 5) * 10) / 10,
            heartRate: Math.floor(120 + Math.random() * 60),
            timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString()
          })
        }
        const res = await fetch("/api/gps/bluetooth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackerId: connectedBtDevice,
            battery: Math.floor(80 + Math.random() * 15),
            telemetryPoints: mockPoints
          })
        })
        const data = await res.json()
        if (data.success) {
          setBtSyncProgress("Synchro réussie !")
          setSuccessMsg(`Synchronisation réussie : ${data.pointsAdded} points importés depuis le boîtier Bluetooth.`)
          router.refresh()
          setTimeout(() => setSuccessMsg(""), 4000)
        } else {
          setBtSyncProgress(`Erreur: ${data.error}`)
        }
      } catch (err) {
        setBtSyncProgress("Erreur réseau.")
      }
    }, 1500)
  }

  const handleWifiSimulatePing = async () => {
    setWifiSimStatus("Envoi du ping WiFi...")
    try {
      const res = await fetch("/api/gps/wifi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackerId: wifiSimTrackerId,
          battery: Number(wifiSimBattery),
          x: Number(wifiSimX),
          y: Number(wifiSimY),
          speed: Number(wifiSimSpeed),
          heartRate: Number(wifiSimHR),
          eventId: selectedLiveEventId || null,
          timestamp: new Date().toISOString()
        })
      })
      const data = await res.json()
      if (data.success) {
        setWifiSimStatus(`Succès! Dispositif: ${data.deviceId}. Télémétrie: ${data.telemetrySaved ? "En direct" : "Boîtier non attribué"}`)
        router.refresh()
      } else {
        setWifiSimStatus(`Erreur: ${data.error}`)
      }
    } catch (err) {
      setWifiSimStatus("Erreur réseau.")
    }
  }

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [inspectingRecord, setInspectingRecord] = useState<any | null>(null)
  const [inspectingTelemetry, setInspectingTelemetry] = useState<any[] | null>(null)
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false)
  const [isManualFormOpen, setIsManualFormOpen] = useState(false)

  const simPositionsRef = useRef<Record<string, { x: number; y: number }>>({})
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pusherRef = useRef<any>(null)

  // Cleanup timers & Pusher on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current)
      if (pusherRef.current) {
        pusherRef.current.disconnect()
      }
    }
  }, [])

  const startLiveTracking = () => {
    setErrorMsg("")
    setSuccessMsg("")
    setIsLiveTracking(true)

    const pusherAppKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (pusherAppKey && pusherCluster) {
      try {
        const pusher = new Pusher(pusherAppKey, {
          cluster: pusherCluster,
          forceTLS: true
        })
        pusherRef.current = pusher

        const channelName = selectedLiveEventId ? `live-tracking-${selectedLiveEventId}` : "live-tracking-general"
        const channel = pusher.subscribe(channelName)
        
        channel.bind("player-moved", (data: any) => {
          const timestamp = new Date(data.timestamp)
          setLivePlayersPosition(prev => ({
            ...prev,
            [data.playerId]: {
              x: data.x,
              y: data.y,
              speed: data.speed,
              heartRate: data.heartRate,
              timestamp
            }
          }))

          setLiveTelemetry(prev => [
            {
              playerId: data.playerId,
              x: data.x,
              y: data.y,
              speed: data.speed,
              heartRate: data.heartRate,
              timestamp
            },
            ...prev.slice(0, 49) // keep last 50 points
          ])
        })
      } catch (err) {
        console.error("Pusher connection error:", err)
      }
    } else {
      console.log("Pusher keys not found. Live loopback mode active.")
    }
  }

  const stopLiveTracking = async () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
      simulationIntervalRef.current = null
    }
    setIsSimulating(false)

    if (pusherRef.current) {
      pusherRef.current.disconnect()
      pusherRef.current = null
    }
    setIsLiveTracking(false)

    // Save/Flush in database
    startTransition(async () => {
      try {
        const res = await fetch("/api/gps-receiver/end", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ eventId: selectedLiveEventId || null })
        })
        const data = await res.json()
        if (data.success) {
          setSuccessMsg(`Session terminée. ${data.count} points de télémétrie sauvegardés !`)
          setLivePlayersPosition({})
          setLiveTelemetry([])
          router.refresh()
          setTimeout(() => setSuccessMsg(""), 4000)
        } else {
          setErrorMsg(data.error || "Erreur lors de la sauvegarde de fin de session.")
        }
      } catch (err) {
        setErrorMsg("Erreur réseau lors de la sauvegarde.")
      }
    })
  }

  const startSimulation = () => {
    if (!isLiveTracking) {
      startLiveTracking()
    }
    setIsSimulating(true)

    // Initialize random positions for all active players
    players.forEach(p => {
      if (!simPositionsRef.current[p.id]) {
        simPositionsRef.current[p.id] = {
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10
        }
      }
    })

    simulationIntervalRef.current = setInterval(async () => {
      const assignedPlayerIds = players.filter(p => gpsDevices.some(d => d.playerId === p.id))
      const activeSubset = assignedPlayerIds.length > 0 ? assignedPlayerIds.slice(0, 10) : players.slice(0, 5)
      for (const p of activeSubset) {
        const cur = simPositionsRef.current[p.id] || { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }
        
        // Simulating tactical soccer runs (move in bounds 5 to 95)
        let dx = (Math.random() - 0.5) * 8
        let dy = (Math.random() - 0.5) * 8
        let newX = Math.max(5, Math.min(95, cur.x + dx))
        let newY = Math.max(5, Math.min(95, cur.y + dy))
        
        simPositionsRef.current[p.id] = { x: newX, y: newY }
        const speed = Math.round((Math.random() * 22 + 5) * 10) / 10 // km/h
        const heartRate = Math.floor(130 + Math.random() * 55) // BPM

        const associatedDevice = gpsDevices.find((d) => d.playerId === p.id)

        const pingBody: any = {
          eventId: selectedLiveEventId || null,
          x: newX,
          y: newY,
          speed,
          heartRate,
          timestamp: new Date().toISOString()
        }

        if (associatedDevice) {
          pingBody.trackerId = associatedDevice.id
        } else {
          pingBody.playerId = p.id
        }

        // Post to api/gps-receiver
        fetch("/api/gps-receiver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pingBody)
        }).catch(err => console.error("Sim error:", err))

        // Loopback local update immediately so UI reacts even without Pusher
        setLivePlayersPosition(prev => ({
          ...prev,
          [p.id]: {
            x: newX,
            y: newY,
            speed,
            heartRate,
            timestamp: new Date()
          }
        }))

        setLiveTelemetry(prev => [
          {
            playerId: p.id,
            x: newX,
            y: newY,
            speed,
            heartRate,
            timestamp: new Date()
          },
          ...prev.slice(0, 49)
        ])
      }
    }, 1200)
  }

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
      simulationIntervalRef.current = null
    }
    setIsSimulating(false)
  }


  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("Tous")
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState("Tous")
  const [searchQuery, setSearchQuery] = useState("")

  // Form parameters
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [selectedEventId, setSelectedEventId] = useState("")
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0])

  // Form metrics - Baselines
  const [distanceTotal, setDistanceTotal] = useState(8.5)
  const [hsrDistance, setHsrDistance] = useState(800)
  const [sprintDistance, setSprintDistance] = useState(150)
  const [accelerations, setAccelerations] = useState(45)
  const [decelerations, setDecelerations] = useState(42)
  const [vMax, setVMax] = useState(28.5)
  const [avgHeartRate, setAvgHeartRate] = useState(165)
  const [peakHeartRate, setPeakHeartRate] = useState(188)
  const [redZoneTime, setRedZoneTime] = useState(25)

  const [xG, setXG] = useState(0.12)
  const [xA, setXA] = useState(0.08)
  const [progressivePasses, setProgressivePasses] = useState(6)
  const [successUnderPressure, setSuccessUnderPressure] = useState(78)
  const [duelsWon, setDuelsWon] = useState(55)
  const [turnovers, setTurnovers] = useState(8)
  const [recoveries, setRecoveries] = useState(5)

  const [ppda, setPpda] = useState(10.5)
  const [compacity, setCompacity] = useState(12.0)
  const [reactionTime, setReactionTime] = useState(1.8)
  const [heatmapX, setHeatmapX] = useState<number | null>(50)
  const [heatmapY, setHeatmapY] = useState<number | null>(50)

  const [acwr, setAcwr] = useState(1.1)
  const [asymmetry, setAsymmetry] = useState(2.5)
  const [neuromuscularFatigue, setNeuromuscularFatigue] = useState(8.0)

  // Active Selected Record for Detail panel
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    records.length > 0 ? records[0].id : null
  )

  const activeRecord = useMemo(() => {
    return records.find((r) => r.id === selectedRecordId) || null
  }, [records, selectedRecordId])

  // Click handler on Pitch graphic (Form creation)
  const handlePitchClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    setHeatmapX(x)
    setHeatmapY(y)
  }

  // Handle Form Submission (Create or Edit)
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")

    if (!selectedPlayerId) {
      setErrorMsg("Veuillez sélectionner un joueur.")
      return
    }

    startTransition(async () => {
      const metricsObj = {
        distanceTotal: Number(distanceTotal),
        hsrDistance: Number(hsrDistance),
        sprintDistance: Number(sprintDistance),
        accelerations: Number(accelerations),
        decelerations: Number(decelerations),
        vMax: Number(vMax),
        avgHeartRate: Number(avgHeartRate),
        peakHeartRate: Number(peakHeartRate),
        redZoneTime: Number(redZoneTime),

        xG: Number(xG),
        xA: Number(xA),
        progressivePasses: Number(progressivePasses),
        successUnderPressure: Number(successUnderPressure),
        duelsWon: Number(duelsWon),
        turnovers: Number(turnovers),
        recoveries: Number(recoveries),

        ppda: Number(ppda),
        compacity: Number(compacity),
        reactionTime: Number(reactionTime),
        heatmapX,
        heatmapY,

        acwr: Number(acwr),
        asymmetry: Number(asymmetry),
        neuromuscularFatigue: Number(neuromuscularFatigue)
      }

      let res
      if (editingRecordId) {
        res = await updateGPSData(editingRecordId, selectedPlayerId, selectedEventId || null, recordDate, metricsObj)
      } else {
        res = await createGPSData(selectedPlayerId, selectedEventId || null, recordDate, metricsObj)
      }

      if (res.success) {
        const playerObj = players.find((p) => p.id === selectedPlayerId)
        setSuccessMsg(
          editingRecordId
            ? `Fiche GPS mise à jour avec succès pour ${playerObj?.name || "le joueur"} !`
            : `Fiche GPS enregistrée avec succès pour ${playerObj?.name || "le joueur"} !`
        )
        
        // Reset form variables to defaults
        setEditingRecordId(null)
        setSelectedPlayerId("")
        setSelectedEventId("")
        setHeatmapX(50)
        setHeatmapY(50)
        setDistanceTotal(8.5)
        setHsrDistance(800)
        setSprintDistance(150)
        setAccelerations(45)
        setDecelerations(42)
        setVMax(28.5)
        setAvgHeartRate(165)
        setPeakHeartRate(188)
        setRedZoneTime(25)
        setXG(0.12)
        setXA(0.08)
        setProgressivePasses(6)
        setSuccessUnderPressure(78)
        setDuelsWon(55)
        setTurnovers(8)
        setRecoveries(5)
        setPpda(10.5)
        setCompacity(12.0)
        setReactionTime(1.8)
        setAcwr(1.1)
        setAsymmetry(2.5)
        setNeuromuscularFatigue(8.0)

        router.refresh()
        setIsManualFormOpen(false)
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || "Erreur lors de l'enregistrement.")
      }
    })
  }

  const handleCancelEdit = () => {
    setEditingRecordId(null)
    setSelectedPlayerId("")
    setSelectedEventId("")
    setHeatmapX(50)
    setHeatmapY(50)
    setDistanceTotal(8.5)
    setHsrDistance(800)
    setSprintDistance(150)
    setAccelerations(45)
    setDecelerations(42)
    setVMax(28.5)
    setAvgHeartRate(165)
    setPeakHeartRate(188)
    setRedZoneTime(25)
    setXG(0.12)
    setXA(0.08)
    setProgressivePasses(6)
    setSuccessUnderPressure(78)
    setDuelsWon(55)
    setTurnovers(8)
    setRecoveries(5)
    setPpda(10.5)
    setCompacity(12.0)
    setReactionTime(1.8)
    setAcwr(1.1)
    setAsymmetry(2.5)
    setNeuromuscularFatigue(8.0)
    setIsManualFormOpen(false)
  }

  const startEditingRecord = (r: any) => {
    setEditingRecordId(r.id)
    setSelectedPlayerId(r.playerId)
    setSelectedEventId(r.eventId || "")
    setRecordDate(r.date.split("T")[0])
    
    setDistanceTotal(r.distanceTotal)
    setHsrDistance(r.hsrDistance)
    setSprintDistance(r.sprintDistance)
    setAccelerations(r.accelerations)
    setDecelerations(r.decelerations)
    setVMax(r.vMax)
    setAvgHeartRate(r.avgHeartRate)
    setPeakHeartRate(r.peakHeartRate)
    setRedZoneTime(r.redZoneTime)

    setXG(r.xG)
    setXA(r.xA)
    setProgressivePasses(r.progressivePasses)
    setSuccessUnderPressure(r.successUnderPressure)
    setDuelsWon(r.duelsWon)
    setTurnovers(r.turnovers)
    setRecoveries(r.recoveries)

    setPpda(r.ppda)
    setCompacity(r.compacity)
    setReactionTime(r.reactionTime)
    setHeatmapX(r.heatmapX || 50)
    setHeatmapY(r.heatmapY || 50)

    setAcwr(r.acwr)
    setAsymmetry(r.asymmetry)
    setNeuromuscularFatigue(r.neuromuscularFatigue)
    setIsManualFormOpen(true)
  }

  // Handle deletion
  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet enregistrement GPS ?")) return
    setErrorMsg("")
    setSuccessMsg("")

    startTransition(async () => {
      const res = await deleteGPSData(id)
      if (res.success) {
        setSuccessMsg("Enregistrement GPS supprimé avec succès.")
        if (selectedRecordId === id) {
          setSelectedRecordId(records.length > 1 ? records.filter((r) => r.id !== id)[0].id : null)
        }
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || "Erreur de suppression.")
      }
    })
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Joueur",
      "Categorie",
      "Evenement",
      "Distance Totale (km)",
      "HSR (m)",
      "Sprint (m)",
      "Vmax (km/h)",
      "FC Moy (BPM)",
      "xG",
      "xA",
      "Passes Progressives",
      "Reussite Pression (%)",
      "Duels Gagnes (%)",
      "Ballons Perdus",
      "Recuperations",
      "PPDA",
      "Compacite (m)",
      "ACWR",
      "Asymetrie (%)",
      "Fatigue Neuromusculaire CMJ (%)"
    ]

    const rows = filteredRecords.map((r) => [
      formatDate(r.date),
      r.playerName,
      r.playerCategoryName,
      r.eventTitle || "N/A",
      r.distanceTotal.toString(),
      r.hsrDistance.toString(),
      r.sprintDistance.toString(),
      r.vMax.toString(),
      r.avgHeartRate.toString(),
      r.xG.toString(),
      r.xA.toString(),
      r.progressivePasses.toString(),
      r.successUnderPressure.toString(),
      r.duelsWon.toString(),
      r.turnovers.toString(),
      r.recoveries.toString(),
      r.ppda.toString(),
      r.compacity.toString(),
      r.acwr.toString(),
      r.asymmetry.toString(),
      r.neuromuscularFatigue.toString()
    ])

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `rapport_gps_performance_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesCategory =
        selectedCategoryFilter === "Tous" || r.playerCategoryId === selectedCategoryFilter
      const matchesPlayer =
        selectedPlayerFilter === "Tous" || r.playerId === selectedPlayerFilter
      const matchesSearch =
        r.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.eventTitle && r.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesPlayer && matchesSearch
    })
  }, [records, selectedCategoryFilter, selectedPlayerFilter, searchQuery])

  // Get active players under the category filter
  const filteredPlayersForFilter = useMemo(() => {
    if (selectedCategoryFilter === "Tous") return players
    return players.filter((p) => p.teamCategoryId === selectedCategoryFilter)
  }, [players, selectedCategoryFilter])

  // Formatted date helper
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  // ACWR Safety Status helper
  const getACWRStatus = (val: number) => {
    if (val >= 0.8 && val <= 1.3) {
      return { label: "Optimal (Safe)", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" }
    }
    if ((val >= 0.5 && val < 0.8) || (val > 1.3 && val <= 1.5)) {
      return { label: "Surcharge (Caution)", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" }
    }
    return { label: "Risque Blessure (Danger)", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" }
  }

  // Compute stats averages from filtered records
  const averages = useMemo(() => {
    if (filteredRecords.length === 0) return null
    const count = filteredRecords.length
    return {
      distance: (filteredRecords.reduce((acc, r) => acc + r.distanceTotal, 0) / count).toFixed(1),
      hsr: Math.round(filteredRecords.reduce((acc, r) => acc + r.hsrDistance, 0) / count),
      sprint: Math.round(filteredRecords.reduce((acc, r) => acc + r.sprintDistance, 0) / count),
      xG: (filteredRecords.reduce((acc, r) => acc + r.xG, 0) / count).toFixed(2),
      xA: (filteredRecords.reduce((acc, r) => acc + r.xA, 0) / count).toFixed(2),
      duels: Math.round(filteredRecords.reduce((acc, r) => acc + r.duelsWon, 0) / count),
      ppda: (filteredRecords.reduce((acc, r) => acc + r.ppda, 0) / count).toFixed(1),
      compacity: (filteredRecords.reduce((acc, r) => acc + r.compacity, 0) / count).toFixed(1),
      fatigue: (filteredRecords.reduce((acc, r) => acc + r.neuromuscularFatigue, 0) / count).toFixed(1)
    }
  }, [filteredRecords])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Messages */}
      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs font-bold text-red-500 shadow-sm animate-bounce">
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs font-bold text-emerald-500 shadow-sm">
          🎉 {successMsg}
        </div>
      )}

      {/* Header Banner */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase flex items-center gap-2">
            🛰️ {t("feat_gps_title")}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Suivi et analyse approfondie des indices physiques, techniques, tactiques et de la charge de travail des athlètes.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredRecords.length === 0}
          className="rounded-xl bg-zinc-200 hover:bg-zinc-300 disabled:opacity-50 text-emerald-600 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-emerald-450 dark:border-zinc-700 font-black uppercase text-[10px] tracking-wider px-4 py-2.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
        >
          Exporter (CSV)
        </button>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <button
          onClick={() => setActiveTab("manual")}
          className={`py-2.5 px-4 font-black uppercase text-[10px] tracking-wider transition-all border-b-2 -mb-px ${
            activeTab === "manual"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"
          }`}
        >
          🗂️ {t("gps_tab_manual")}
        </button>
        <button
          onClick={() => setActiveTab("live")}
          className={`py-2.5 px-4 font-black uppercase text-[10px] tracking-wider transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === "live"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"
          }`}
        >
          🛰️ {t("gps_tab_live")}
          {isLiveTracking && (
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          )}
        </button>
      </div>

      {activeTab === "manual" ? (
        <>
          {/* Summary Metrics Cards */}
          {averages && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-zinc-200/40 bg-zinc-50/50 dark:bg-zinc-950/20 dark:border-zinc-800/40 p-4 space-y-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500">🏃 Volume Athlétique</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-zinc-800 dark:text-white">{averages.distance}</span>
              <span className="text-[10px] font-bold text-zinc-400">km moy.</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold">HSR : {averages.hsr}m | Sprints : {averages.sprint}m</p>
          </div>

          <div className="rounded-xl border border-zinc-200/40 bg-zinc-50/50 dark:bg-zinc-950/20 dark:border-zinc-800/40 p-4 space-y-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-blue-500">⚽ Rendement Technique</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-zinc-800 dark:text-white">{averages.xG}</span>
              <span className="text-[10px] font-bold text-zinc-400">xG moy.</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold">xA : {averages.xA} | Duels gagnés : {averages.duels}%</p>
          </div>

          <div className="rounded-xl border border-zinc-200/40 bg-zinc-50/50 dark:bg-zinc-950/20 dark:border-zinc-800/40 p-4 space-y-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-purple-500">🧠 Cohésion & Alignement</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-zinc-800 dark:text-white">{averages.compacity}</span>
              <span className="text-[10px] font-bold text-zinc-400">mètres comp.</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold">PPDA collectif : {averages.ppda}</p>
          </div>

          <div className="rounded-xl border border-zinc-200/40 bg-zinc-50/50 dark:bg-zinc-950/20 dark:border-zinc-800/40 p-4 space-y-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-500">🛡️ Prévention Blessures</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-zinc-800 dark:text-white">{averages.fatigue}%</span>
              <span className="text-[10px] font-bold text-zinc-400">fatigue CMJ</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold">Risque de surcharge surveillé</p>
          </div>
        </div>
      )}

      {/* Full-width content wrapper */}
      <div className="space-y-6">
        
        {/* Filters Bar & Button */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-850 dark:text-white">
                Historique des sessions ({filteredRecords.length})
              </h3>
              <button
                onClick={() => {
                  setEditingRecordId(null)
                  setSelectedPlayerId("")
                  setSelectedEventId("")
                  setRecordDate(new Date().toISOString().split("T")[0])
                  setDistanceTotal(8.5)
                  setHsrDistance(800)
                  setSprintDistance(150)
                  setAccelerations(45)
                  setDecelerations(42)
                  setVMax(28.5)
                  setAvgHeartRate(165)
                  setPeakHeartRate(188)
                  setRedZoneTime(25)
                  setXG(0.12)
                  setXA(0.08)
                  setProgressivePasses(6)
                  setSuccessUnderPressure(78)
                  setDuelsWon(55)
                  setTurnovers(8)
                  setRecoveries(5)
                  setPpda(10.5)
                  setCompacity(12.0)
                  setReactionTime(1.8)
                  setAcwr(1.1)
                  setAsymmetry(2.5)
                  setNeuromuscularFatigue(8.0)
                  setHeatmapX(50)
                  setHeatmapY(50)

                  setIsManualFormOpen(true)
                }}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
              >
                📝 Enregistrer une session GPS manuelle
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <input
                type="text"
                placeholder="Rechercher par joueur/événement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 md:w-48 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-905 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-medium"
              />

              {/* Team Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => {
                  setSelectedCategoryFilter(e.target.value)
                  setSelectedPlayerFilter("Tous") // Reset player filter on category change
                }}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-905 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                <option value="Tous">Toutes les équipes</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Player Filter */}
              <select
                value={selectedPlayerFilter}
                onChange={(e) => setSelectedPlayerFilter(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-905 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                <option value="Tous">Tous les joueurs</option>
                {filteredPlayersForFilter.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table of Records */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-850 dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-450 uppercase text-[9px] font-black tracking-wider">
                  <th className="p-4">Joueur</th>
                  <th className="p-4">Numéro</th>
                  <th className="p-4">Âge</th>
                  <th className="p-4">Équipe</th>
                  <th className="p-4">Poste</th>
                  <th className="p-4">Indices Clés</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 font-bold text-zinc-800 dark:text-zinc-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-400 italic">
                      Aucun rapport GPS trouvé pour les filtres sélectionnés.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r: any) => (
                    <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-all">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-zinc-900 dark:text-white">{r.playerName}</span>
                          <span className="text-[9px] text-zinc-400 font-semibold">{formatDate(r.date)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">
                        {r.playerNumber !== null ? `#${r.playerNumber}` : "—"}
                      </td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">
                        {r.playerAge !== null ? `${r.playerAge} ans` : "—"}
                      </td>
                      <td className="p-4">
                        <span className="rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 text-[9px] font-black uppercase">
                          {r.playerCategoryName}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">
                        {r.playerPosition || "—"}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2 text-[10px] text-zinc-550 dark:text-zinc-400 font-bold">
                          <span className="bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 px-1.5 py-0.5 rounded">
                            🏃 {r.distanceTotal} km
                          </span>
                          <span className="bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/10 px-1.5 py-0.5 rounded">
                            ⚡ Vmax: {r.vMax} km/h
                          </span>
                          <span className="bg-purple-500/5 text-purple-600 dark:text-purple-400 border border-purple-500/10 px-1.5 py-0.5 rounded">
                            ❤️ Cardio: {r.avgHeartRate} BPM
                          </span>
                          {r.xG > 0 && (
                            <span className="bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/10 px-1.5 py-0.5 rounded">
                              ⚽ xG: {r.xG}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setInspectingRecord(r)
                              setIsLoadingTelemetry(true)
                              setInspectingTelemetry(null)
                              startTransition(async () => {
                                try {
                                  const res = await getTelemetryForRecord(r.playerId, r.eventId, r.date)
                                  if (res.success && res.points) {
                                    setInspectingTelemetry(res.points)
                                  } else {
                                    setInspectingTelemetry([])
                                  }
                                } catch (err) {
                                  console.error(err)
                                  setInspectingTelemetry([])
                                } finally {
                                  setIsLoadingTelemetry(false)
                                }
                              })
                            }}
                            className="rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Inspecter
                          </button>
                          <button
                            onClick={() => startEditingRecord(r)}
                            className="rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-455 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(r.id)}
                            className="rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-500 hover:text-red-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  ) : (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-1 w-full md:w-auto text-left">
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">{t("gps_live_session")} :</span>
            <select
              value={selectedLiveEventId}
              onChange={(e) => setSelectedLiveEventId(e.target.value)}
              disabled={isLiveTracking}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
            >
              <option value="">-- Session Libre (Pas d'événement) --</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  [{e.type}] {e.title} ({formatDate(e.date)})
                </option>
              ))}
            </select>
          </div>

          {isLiveTracking && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl px-3 py-2 text-xs font-bold animate-pulse">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              SUIVI EN DIRECT ACTIF
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Simulation Mode controls */}
          <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 bg-zinc-50 dark:bg-zinc-950">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 px-2">{t("gps_simulation")} :</span>
            {isSimulating ? (
              <button
                onClick={stopSimulation}
                className="rounded-lg bg-amber-500 text-white font-black uppercase text-[9px] tracking-wide px-3 py-1.5 transition-all shadow-sm cursor-pointer"
              >
                {t("gps_sim_stop")}
              </button>
            ) : (
              <button
                onClick={startSimulation}
                disabled={isPending}
                className="rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-black uppercase text-[9px] tracking-wide px-3 py-1.5 transition-all shadow-sm cursor-pointer"
              >
                {t("gps_sim_start")}
              </button>
            )}
          </div>

          {isLiveTracking ? (
            <button
              onClick={stopLiveTracking}
              disabled={isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-wider px-5 py-2.5 transition-all cursor-pointer shadow-md"
            >
              {t("gps_stop_live")}
            </button>
          ) : (
            <button
              onClick={startLiveTracking}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black uppercase text-[10px] tracking-wider px-5 py-2.5 transition-all cursor-pointer shadow-md"
            >
              {t("gps_start_live")}
            </button>
          )}
        </div>
      </div>

      {/* Live Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (2 cols span): SVG Pitch */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white flex items-center gap-1.5">
                ⚽ Tableau Tactique en Direct
              </h3>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                Terrain SVG 105m x 68m
              </span>
            </div>

            {/* SVG Pitch Canvas */}
            <div className="relative aspect-[3/2] w-full rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-inner">
              <svg
                className="w-full h-full bg-[#1b3f2b] select-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {/* Pitch Green grass stripes pattern */}
                <g opacity="0.15">
                  <rect x="0" y="0" width="10" height="100" fill="#143020" />
                  <rect x="20" y="0" width="10" height="100" fill="#143020" />
                  <rect x="40" y="0" width="10" height="100" fill="#143020" />
                  <rect x="60" y="0" width="10" height="100" fill="#143020" />
                  <rect x="80" y="0" width="10" height="100" fill="#143020" />
                </g>

                {/* Outer Boundary line */}
                <rect x="3" y="3" width="94" height="94" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Halfway line */}
                <line x1="50" y1="3" x2="50" y2="97" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Center circle */}
                <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.8)" />

                {/* Penalty box Left */}
                <rect x="3" y="25" width="14" height="50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <rect x="3" y="37" width="5" height="26" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <circle cx="12" cy="50" r="0.6" fill="rgba(255,255,255,0.8)" />
                <path d="M 17,42 A 8,8 0 0,1 17,58" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

                {/* Penalty box Right */}
                <rect x="83" y="25" width="14" height="50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <rect x="92" y="37" width="5" height="26" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <circle cx="88" cy="50" r="0.6" fill="rgba(255,255,255,0.8)" />
                <path d="M 83,42 A 8,8 0 0,0 83,58" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

                {/* Goals */}
                <rect x="1" y="44" width="2" height="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
                <rect x="97" y="44" width="2" height="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />

                {/* Render live players positions */}
                {Object.entries(livePlayersPosition).map(([pId, pos]) => {
                  const pObj = players.find(p => p.id === pId)
                  const name = pObj ? pObj.name : "Joueur"
                  const number = pObj ? pObj.id.slice(-2) : "99"
                  
                  // Highlight high-fatigue or dangerous thresholds
                  const isDanger = pos.speed > 28 || (pos.heartRate && pos.heartRate > 185)

                  return (
                    <g key={pId}>
                      {/* Pulsing ring */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="3.5"
                        fill="none"
                        stroke={isDanger ? "#EF4444" : "#10B981"}
                        strokeWidth="0.5"
                        className="animate-ping"
                        opacity="0.8"
                      />
                      {/* Main player dot */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="2.2"
                        fill={isDanger ? "#EF4444" : "#10B981"}
                        stroke="white"
                        strokeWidth="0.5"
                        className="transition-all duration-1000 ease-out cursor-pointer"
                      />
                      {/* Jersey text */}
                      <text
                        x={pos.x}
                        y={pos.y + 0.75}
                        fontSize="1.6"
                        fontWeight="black"
                        fill="white"
                        textAnchor="middle"
                        className="pointer-events-none select-none font-sans font-bold"
                      >
                        {number}
                      </text>
                      {/* Floating name tooltip */}
                      <text
                        x={pos.x}
                        y={pos.y - 3}
                        fontSize="1.8"
                        fontWeight="bold"
                        fill="white"
                        textAnchor="middle"
                        className="pointer-events-none select-none font-bold drop-shadow"
                      >
                        {name.split(" ")[0]}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {!isLiveTracking && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <p className="text-sm font-black text-white uppercase tracking-wider">
                    📡 Flux en attente de synchronisation
                  </p>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Sélectionnez une session ou activez le mode Simulation, puis cliquez sur le bouton "Commencer le suivi" pour visualiser les mouvements en temps réel.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Live Players stats panel */}
          {isLiveTracking && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 space-y-4">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white">
                  📊 Métriques Instantanées des Joueurs
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {players.map((p) => {
                  const pos = livePlayersPosition[p.id]
                  const active = !!pos
                  const warning = active && (pos.speed > 28 || (pos.heartRate && pos.heartRate > 180))

                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl border p-3 flex flex-col justify-between space-y-2 transition-all text-left ${
                        active 
                          ? warning
                            ? "bg-red-500/5 border-red-500/20"
                            : "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-zinc-50 border-zinc-100 dark:bg-zinc-950/20 dark:border-zinc-800/60 opacity-60"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-zinc-800 dark:text-white leading-none">
                            {p.name}
                          </p>
                          <span className="text-[8px] font-bold text-zinc-400 uppercase">
                            {p.teamCategoryName}
                          </span>
                        </div>
                        <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-zinc-350"}`} />
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-zinc-400 uppercase">Vitesse</span>
                          <span className="text-zinc-800 dark:text-white font-extrabold">
                            {active ? `${pos.speed} km/h` : "N/A"}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[8px] text-zinc-400 uppercase">Cardio</span>
                          <span className={`font-extrabold ${warning ? "text-red-500 animate-bounce" : "text-zinc-800 dark:text-white"}`}>
                            {active && pos.heartRate ? `${pos.heartRate} BPM` : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Boîtiers GPS / Console Live Log Toggle */}
        <div className="lg:col-span-1 space-y-4 text-left">
          <div className="flex border-b border-zinc-200 dark:border-zinc-850">
            <button
              onClick={() => setActiveConsoleTab("devices")}
              className={`py-2 px-3 font-black uppercase text-[9px] tracking-wider transition-all border-b-2 cursor-pointer ${
                activeConsoleTab === "devices"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"
              }`}
            >
              📟 Boîtiers
            </button>
            <button
              onClick={() => setActiveConsoleTab("logs")}
              className={`py-2 px-3 font-black uppercase text-[9px] tracking-wider transition-all border-b-2 cursor-pointer ${
                activeConsoleTab === "logs"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"
              }`}
            >
              📺 Logs ({liveTelemetry.length})
            </button>
            <button
              onClick={() => setActiveConsoleTab("bluetooth")}
              className={`py-2 px-3 font-black uppercase text-[9px] tracking-wider transition-all border-b-2 cursor-pointer ${
                activeConsoleTab === "bluetooth"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"
              }`}
            >
              🔵 Bluetooth
            </button>
            <button
              onClick={() => setActiveConsoleTab("wifi")}
              className={`py-2 px-3 font-black uppercase text-[9px] tracking-wider transition-all border-b-2 cursor-pointer ${
                activeConsoleTab === "wifi"
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"
              }`}
            >
              📶 WiFi
            </button>
          </div>

          {activeConsoleTab === "logs" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-lg text-emerald-400 font-mono h-[520px] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
                  <span className="text-xs font-bold tracking-widest text-zinc-400 flex items-center gap-1.5 uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t("gps_pings_received")}
                  </span>
                  <span className="text-[9px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-500 font-bold">
                    {liveTelemetry.length} Pkts
                  </span>
                </div>

                {/* Terminal Packet Flow */}
                <div className="space-y-2 overflow-y-auto max-h-[390px] scrollbar-thin scrollbar-thumb-zinc-850 pr-1 text-[10px]">
                  {liveTelemetry.length === 0 ? (
                    <p className="text-zinc-600 italic text-[11px]">Flux de télémétrie inactif. En attente de paquets UDP/WebSocket...</p>
                  ) : (
                    liveTelemetry.map((tPoint, idx) => {
                      const pObj = players.find(p => p.id === tPoint.playerId)
                      return (
                        <div key={idx} className="border-b border-zinc-900/50 pb-1.5 hover:bg-zinc-900/30 px-1 transition-all">
                          <span className="text-zinc-600">[{tPoint.timestamp.toLocaleTimeString()}]</span>{" "}
                          <span className="text-blue-400 font-bold">{pObj?.name.split(" ")[0]}</span> :{" "}
                          <span className="text-emerald-500 font-bold">x:{tPoint.x.toFixed(1)}% y:{tPoint.y.toFixed(1)}%</span>{" "}
                          <span className="text-purple-400">{tPoint.speed}km/h</span>{" "}
                          <span className="text-red-400">{tPoint.heartRate || "N/A"}bpm</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-[9px] text-zinc-500">
                <span>SYS: ONLINE</span>
                <span>PROTO: WebSocket/UDP</span>
              </div>
            </div>
          )}

          {activeConsoleTab === "devices" && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 h-[520px] flex flex-col justify-between">
              <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white">
                    Enregistrer un nouveau boîtier GPS
                  </h3>
                </div>

                {/* Add Device form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!newDeviceId.trim()) return
                    setErrorMsg("")
                    setSuccessMsg("")
                    startTransition(async () => {
                      const res = await createGpsDevice(newDeviceId)
                      if (res.success) {
                        setSuccessMsg(`Boîtier ${newDeviceId} enregistré avec succès.`)
                        setNewDeviceId("")
                        router.refresh()
                        setTimeout(() => setSuccessMsg(""), 4000)
                      } else {
                        setErrorMsg(res.error || "Erreur d'enregistrement.")
                      }
                    })
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ex: GPS-A1B2-99"
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-black uppercase text-[9px] tracking-wider px-4 py-2 cursor-pointer transition-all"
                  >
                    Ajouter
                  </button>
                </form>

                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white">
                    Liste des boîtiers ({gpsDevices.length})
                  </h3>
                </div>

                {/* Device List */}
                <div className="space-y-3">
                  {gpsDevices.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">Aucun boîtier GPS enregistré dans l'inventaire.</p>
                  ) : (
                    gpsDevices.map((device) => (
                      <div
                        key={device.id}
                        className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-950/20 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-zinc-800 dark:text-zinc-100">
                            📟 {device.id}
                          </span>
                          <div className="flex items-center gap-2">
                            {device.battery !== null && (
                              <span className="text-[10px] font-bold text-zinc-500">
                                🔋 {device.battery}%
                              </span>
                            )}
                            <button
                              onClick={() => {
                                if (!confirm(`Voulez-vous supprimer le boîtier ${device.id} ?`)) return
                                startTransition(async () => {
                                  const res = await deleteGpsDevice(device.id)
                                  if (res.success) {
                                    setSuccessMsg(`Boîtier ${device.id} supprimé.`)
                                    router.refresh()
                                    setTimeout(() => setSuccessMsg(""), 4000)
                                  } else {
                                    setErrorMsg(res.error || "Erreur de suppression.")
                                  }
                                })
                              }}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                            Attribution :
                          </span>
                          <select
                            value={device.playerId || ""}
                            disabled={isPending}
                            onChange={(e) => {
                              const val = e.target.value || null
                              startTransition(async () => {
                                const res = await associateGpsDevice(device.id, val)
                                if (res.success) {
                                  setSuccessMsg(
                                    val
                                      ? `Boîtier ${device.id} attribué au joueur.`
                                      : `Boîtier ${device.id} libéré.`
                                  )
                                  router.refresh()
                                  setTimeout(() => setSuccessMsg(""), 4000)
                                } else {
                                  setErrorMsg(res.error || "Erreur d'attribution.")
                                }
                              })
                            }}
                            className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-800 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                          >
                            <option value="">-- Non attribué --</option>
                            {players.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.teamCategoryName})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between items-center text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                <span>Total: {gpsDevices.length} Boîtiers</span>
                <span>Attribuer avant séance</span>
              </div>
            </div>
          )}

          {activeConsoleTab === "bluetooth" && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 h-[520px] flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white flex items-center gap-1.5">
                    <span className="text-blue-500 text-sm">🔹</span> Appairage & Synchro Bluetooth
                  </h3>
                </div>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
                  Connectez un boîtier GPS via BLE (Bluetooth Low Energy) pour enregistrer de nouveaux trackers ou synchroniser des sessions enregistrées hors-ligne.
                </p>

                {/* Scan Button */}
                <button
                  type="button"
                  onClick={handleBluetoothScan}
                  disabled={isBtScanning}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isBtScanning ? (
                    <>
                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Recherche de signaux BLE...
                    </>
                  ) : (
                    <>
                      <span>🔍</span> Scanner les GPS Bluetooth
                    </>
                  )}
                </button>

                {/* Devices Found */}
                {btDevicesFound.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                      Boîtiers détectés à proximité :
                    </span>
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {btDevicesFound.map((dev) => (
                        <div
                          key={dev.id}
                          className="flex justify-between items-center p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold"
                        >
                          <div className="text-left">
                            <p className="text-zinc-800 dark:text-zinc-200">{dev.name}</p>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase">{dev.id}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleConnectBluetooth(dev.id, dev.name)}
                            className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Associer
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connection Status / Sync actions */}
                {connectedBtDevice && (
                  <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3 text-xs text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">
                        🔵 Connecté à {connectedBtDevice}
                      </span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    {btSyncProgress && (
                      <p className="text-[10px] text-zinc-500 font-bold italic animate-pulse">
                        🔄 {btSyncProgress}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleSyncBluetoothData}
                      className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-black uppercase text-[9px] tracking-wider transition-all cursor-pointer"
                    >
                      Importer les données du boîtier
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between items-center text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                <span>Statut : BLE disponible</span>
                <span>Web Bluetooth API</span>
              </div>
            </div>
          )}

          {activeConsoleTab === "wifi" && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 h-[520px] flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white flex items-center gap-1.5">
                    <span className="text-amber-500 text-sm">🔸</span> Connexion & Configuration WiFi
                  </h3>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-550 dark:text-zinc-400 space-y-1.5 text-left font-medium">
                  <p className="font-bold text-zinc-700 dark:text-zinc-350 uppercase text-[9px]">Configuration Serveur WiFi :</p>
                  <p>Pour envoyer des données en direct via WiFi, configurez vos boîtiers pour envoyer des requêtes POST JSON à l'URL suivante :</p>
                  <code className="block p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded font-mono text-[9px] text-emerald-600 font-bold overflow-x-auto">
                    http://{serverIp}:3000/api/gps/wifi
                  </code>
                </div>

                {/* WiFi Local Discovery Panel */}
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 bg-zinc-50/20 text-left font-sans">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-705 dark:text-zinc-300">
                    🔍 Détection de trackers sur le réseau WiFi du PC
                  </h4>
                  <button
                    type="button"
                    onClick={handleWifiScan}
                    disabled={isWifiScanning}
                    className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-black uppercase text-[9px] tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isWifiScanning ? (
                      <>
                        <span className="h-3 w-3 border-2 border-zinc-550 border-t-transparent rounded-full animate-spin" />
                        Recherche sur le WiFi local...
                      </>
                    ) : (
                      "Scanner le réseau WiFi local du PC"
                    )}
                  </button>

                  {wifiDevicesFound.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {wifiDevicesFound.map((dev) => (
                        <div
                          key={dev.id}
                          className="flex justify-between items-center p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[11px] font-bold"
                        >
                          <div className="text-left">
                            <p className="text-zinc-800 dark:text-zinc-200 font-extrabold">📟 {dev.id}</p>
                            <span className="text-[9px] text-zinc-400 font-bold">IP: {dev.ip} | 🔋 {dev.battery}%</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddWifiDevice(dev.id)}
                            className="px-2.5 py-1 rounded bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Ajouter
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* WiFi Simulator Panel */}
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 bg-zinc-50/20 text-left font-sans">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-705 dark:text-zinc-300">
                    🛠️ Simulateur de Ping Boîtier WiFi
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-bold uppercase">ID Tracker</label>
                      <input
                        type="text"
                        value={wifiSimTrackerId}
                        onChange={(e) => setWifiSimTrackerId(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-bold uppercase">Batterie (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={wifiSimBattery}
                        onChange={(e) => setWifiSimBattery(Number(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-bold uppercase">Position X (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={wifiSimX}
                        onChange={(e) => setWifiSimX(Number(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-bold uppercase">Position Y (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={wifiSimY}
                        onChange={(e) => setWifiSimY(Number(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-bold uppercase">Vitesse (km/h)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={wifiSimSpeed}
                        onChange={(e) => setWifiSimSpeed(Number(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-bold uppercase">Cardio (BPM)</label>
                      <input
                        type="number"
                        value={wifiSimHR}
                        onChange={(e) => setWifiSimHR(Number(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-sans"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleWifiSimulatePing}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[9px] tracking-wider shadow-sm transition-all cursor-pointer"
                  >
                    🚀 Simuler Ping WiFi
                  </button>

                  {wifiSimStatus && (
                    <p className="text-[9px] font-mono text-emerald-600 dark:text-emerald-450 leading-relaxed font-bold">
                      {wifiSimStatus}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between items-center text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                <span>Sync : HTTPS POST</span>
                <span>Active</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

  {/* Inspect Modal */}
  {inspectingRecord && (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-5xl shadow-2xl p-6 text-left relative animate-in zoom-in-95 duration-200 flex flex-col gap-4">
        
        {/* Close Button */}
        <button
          onClick={() => {
            setInspectingRecord(null)
            setInspectingTelemetry(null)
          }}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-200 text-lg font-bold cursor-pointer"
        >
          ✕
        </button>

        {/* Header */}
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500">
            🔍 Rapport d&apos;inspection athlétique
          </span>
          <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase leading-tight mt-1">
            {inspectingRecord.playerName}
          </h2>
          <p className="text-[11px] text-zinc-550 dark:text-zinc-400 font-semibold">
            Session du {formatDate(inspectingRecord.date)} | {inspectingRecord.playerCategoryName}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin">
          
          {/* Left Column: Metrics Details */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Visual Status Badges */}
            <div className="flex flex-wrap gap-2">
              {(() => {
                const acwrStat = getACWRStatus(inspectingRecord.acwr)
                return (
                  <div className={`rounded-xl border px-3 py-1.5 text-left flex flex-col justify-center ${acwrStat.bg}`}>
                    <span className={`text-[10px] font-black uppercase ${acwrStat.color}`}>ACWR : {inspectingRecord.acwr}</span>
                    <span className="text-[8px] font-bold text-zinc-450">{acwrStat.label}</span>
                  </div>
                )
              })()}

              {inspectingRecord.asymmetry > 10 ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-left flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-450">⚠️ Asymétrie : {inspectingRecord.asymmetry}%</span>
                  <span className="text-[8px] font-bold text-zinc-450">Risque de blessure musculaire</span>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-left flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-450">✓ Appuis Symétriques</span>
                  <span className="text-[8px] font-bold text-zinc-450">Équilibre gauche/droite parfait</span>
                </div>
              )}

              {inspectingRecord.neuromuscularFatigue > 15 ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-left flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase text-red-500">⚠️ Fatigue CMJ : {inspectingRecord.neuromuscularFatigue}%</span>
                  <span className="text-[8px] font-bold text-zinc-450">Perte de puissance nerveuse</span>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-left flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-450">✓ Récupération CMJ</span>
                  <span className="text-[8px] font-bold text-zinc-450">Niveau de fatigue bas</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Telemetry Physical */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl space-y-3 border border-zinc-150 dark:border-zinc-850">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest border-b border-zinc-150 dark:border-zinc-800 pb-1">
                  ⚡ 1. Télémétrie Physique
                </p>
                <div className="space-y-2 text-[11px] font-bold text-zinc-500">
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Distance totale :</span>
                    <span className="text-zinc-900 dark:text-zinc-200">{inspectingRecord.distanceTotal} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Haute Intensité (HSR) :</span>
                    <span className="text-zinc-900 dark:text-zinc-200">{inspectingRecord.hsrDistance} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Distance Sprint :</span>
                    <span className="text-zinc-900 dark:text-zinc-200">{inspectingRecord.sprintDistance} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Vmax atteint :</span>
                    <span className="text-zinc-900 dark:text-zinc-200 font-extrabold text-emerald-500">{inspectingRecord.vMax} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Accels / Décels :</span>
                    <span className="text-zinc-900 dark:text-zinc-200">{inspectingRecord.accelerations} / {inspectingRecord.decelerations}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-150 dark:border-zinc-800 pt-1.5">
                    <span className="font-semibold text-zinc-450">Cardio moyen/pic :</span>
                    <span className="text-zinc-900 dark:text-zinc-200">{inspectingRecord.avgHeartRate} / {inspectingRecord.peakHeartRate} BPM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Temps Zone Rouge :</span>
                    <span className="text-zinc-900 dark:text-zinc-200 text-red-500">{inspectingRecord.redZoneTime} min</span>
                  </div>
                </div>
              </div>

              {/* 2. Technical */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl space-y-3 border border-zinc-150 dark:border-zinc-850">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest border-b border-zinc-150 dark:border-zinc-800 pb-1">
                  ⚽ 2. Rendement Technique
                </p>
                <div className="space-y-2 text-[11px] font-bold text-zinc-500">
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Expected Goals (xG) :</span>
                    <span className="text-zinc-900 dark:text-zinc-200 font-extrabold text-blue-500">{inspectingRecord.xG}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Expected Assists (xA) :</span>
                    <span className="text-zinc-900 dark:text-zinc-200">{inspectingRecord.xA}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Passes progressives :</span>
                    <span className="text-zinc-900 dark:text-zinc-200">{inspectingRecord.progressivePasses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Réussite sous pression :</span>
                    <span className="text-zinc-900 dark:text-zinc-200">{inspectingRecord.successUnderPressure}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Duels gagnés :</span>
                    <span className="text-zinc-900 dark:text-zinc-200">{inspectingRecord.duelsWon}%</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-150 dark:border-zinc-800 pt-1.5">
                    <span className="font-semibold text-zinc-450">Pertes de balle :</span>
                    <span className="text-zinc-900 dark:text-zinc-200 text-amber-600">{inspectingRecord.turnovers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Récupérations :</span>
                    <span className="text-zinc-900 dark:text-zinc-200 text-emerald-600">{inspectingRecord.recoveries}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Prevention Notes */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl space-y-2 border border-zinc-150 dark:border-zinc-850">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest border-b border-zinc-150 dark:border-zinc-800 pb-1">
                🛡️ Notes Cliniques & Charge de travail
              </p>
              <div className="text-[11px] font-semibold text-zinc-550 dark:text-zinc-450 space-y-1.5">
                <p>• Le ratio ACWR (Acute-to-Chronic Workload Ratio) est à <span className="font-bold text-zinc-800 dark:text-white">{inspectingRecord.acwr}</span>.</p>
                {inspectingRecord.acwr > 1.5 ? (
                  <p className="text-red-500 font-bold">⚠️ Surcharge détectée. Veuillez alléger l&apos;intensité physique lors de la prochaine séance.</p>
                ) : (
                  <p className="text-emerald-500 font-bold">✓ Charge de travail équilibrée. Vert d&apos;activité athlétique.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Heatmap Pitch Visualization */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl space-y-3 border border-zinc-150 dark:border-zinc-850 flex flex-col justify-between h-full">
              <div>
                <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest border-b border-zinc-150 dark:border-zinc-800 pb-1">
                  🧠 Positionnement & Zones parcourues
                </p>
                <p className="text-[9px] text-zinc-450 mt-1 font-semibold">
                  Carte thermique (Heatmap) : les zones très occupées s&apos;affichent en jaune vif, les zones de transition en jaune clair, et le reste conserve la couleur du terrain.
                </p>
              </div>

              {/* SVG Stadium Pitch Heatmap container */}
              <div className="relative aspect-[3/2] w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner mt-2">
                {isLoadingTelemetry ? (
                  <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center text-white gap-2 font-mono text-[10px]">
                    <span className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span>Chargement des coordonnées...</span>
                  </div>
                ) : (
                  <svg className="w-full h-full bg-[#14231a]" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Soccer lines */}
                    <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
                    <line x1="50" y1="2" x2="50" y2="98" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
                    <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
                    <rect x="2" y="25" width="12" height="50" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
                    <rect x="86" y="25" width="12" height="50" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />

                    {/* Heatmap overlay of coordinates */}
                    {inspectingTelemetry && inspectingTelemetry.length > 0 ? (
                      <>
                        <defs>
                          <radialGradient id="heatYellowSpot" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.32" />
                            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.14" />
                            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
                          </radialGradient>
                        </defs>

                        {/* Draw subtle transition line */}
                        <polyline
                          points={inspectingTelemetry.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                          fill="none"
                          stroke="rgba(253, 224, 71, 0.15)"
                          strokeWidth="0.8"
                          strokeDasharray="2,2"
                        />
                        
                        {/* Draw heat spots with yellow gradients */}
                        {inspectingTelemetry.map((pt: any, idx: number) => (
                          <circle
                            key={idx}
                            cx={pt.x}
                            cy={pt.y}
                            r="6"
                            fill="url(#heatYellowSpot)"
                          />
                        ))}
                      </>
                    ) : (
                      // Fallback to manual heatmap dot
                      inspectingRecord.heatmapX !== null && inspectingRecord.heatmapY !== null && (
                        <>
                          <defs>
                            <radialGradient id="heatInspectGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#FDE047" stopOpacity="0.85" />
                              <stop offset="60%" stopColor="#FBBF24" stopOpacity="0.45" />
                              <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
                            </radialGradient>
                          </defs>
                          <circle cx={inspectingRecord.heatmapX} cy={inspectingRecord.heatmapY} r="16" fill="url(#heatInspectGlow)" />
                          <circle cx={inspectingRecord.heatmapX} cy={inspectingRecord.heatmapY} r="2.5" fill="#FDE047" stroke="white" strokeWidth="0.5" />
                        </>
                      )
                    )}
                  </svg>
                )}
              </div>

              {/* Telemetry info message */}
              <div className="bg-zinc-100 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-850 text-[10px] text-zinc-450 font-bold leading-normal">
                {inspectingTelemetry && inspectingTelemetry.length > 0 ? (
                  <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Télémétrie en direct détectée ({inspectingTelemetry.length} paquets).
                  </span>
                ) : (
                  <span className="text-amber-500 font-extrabold">
                    ⚠️ Saisie manuelle. Coordonnées d&apos;influence statiques affichées.
                  </span>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between items-center text-[10px] text-zinc-450 dark:text-zinc-400 font-bold uppercase tracking-wider">
          <span>SYS: INSPECT_OK</span>
          <button
            onClick={() => {
              setInspectingRecord(null)
              setInspectingTelemetry(null)
            }}
            className="rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2 cursor-pointer transition-all"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  )}

  {/* Logger Form Modal (Enregistrer une session GPS manuelle) */}
  {isManualFormOpen && (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl shadow-2xl p-6 text-left relative animate-in zoom-in-95 duration-200 flex flex-col gap-4">
        
        {/* Close Button */}
        <button
          onClick={handleCancelEdit}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 text-lg font-bold cursor-pointer"
        >
          ✕
        </button>

        {/* Header */}
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500">
            📝 Performance Athlétique
          </span>
          <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase leading-tight mt-1">
            {editingRecordId ? "✏️ Modifier la session GPS" : "📝 Enregistrer une session GPS manuelle"}
          </h2>
          <p className="text-[11px] text-zinc-550 dark:text-zinc-400 font-semibold">
            {editingRecordId 
              ? "Modifiez les métriques physiques, tactiques et techniques d'un joueur." 
              : "Saisissez les métriques physiques, tactiques et techniques d'un joueur."}
          </p>
        </div>

        {/* Content / Scrollable Form */}
        <form onSubmit={handleAddRecord} className="space-y-4 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Player */}
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-450 uppercase">Joueur cible * :</label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                required
                disabled={!!editingRecordId}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-955 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                <option value="">-- Sélectionner un joueur --</option>
                {categories.map((cat) => {
                  const catPlayers = players.filter((p) => p.teamCategoryId === cat.id)
                  if (catPlayers.length === 0) return null
                  return (
                    <optgroup key={cat.id} label={cat.name}>
                      {catPlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
            </div>

            {/* Event Select */}
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Événement lié (Optionnel) :</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-955 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                <option value="">-- Aucun (Session individuelle) --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    [{ev.type}] {ev.title} ({formatDate(ev.date)})
                  </option>
                ))}
              </select>
            </div>

            {/* Date select */}
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Date de la session * :</label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-955 outline-none dark:border-zinc-800 dark:bg-zinc-955 dark:text-white font-bold"
              />
            </div>
          </div>

          {/* Form subsections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            
            {/* Physical metrics column */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1">
                ⚡ 1. Télémétrie Physique
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-450 uppercase">Distance totale (km) :</label>
                  <input
                    type="number"
                    step="0.01"
                    value={distanceTotal}
                    onChange={(e) => setDistanceTotal(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-450 uppercase">Haute Intensité (m) :</label>
                  <input
                    type="number"
                    value={hsrDistance}
                    onChange={(e) => setHsrDistance(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-450 uppercase">Sprint (m) :</label>
                  <input
                    type="number"
                    value={sprintDistance}
                    onChange={(e) => setSprintDistance(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Vitesse Max (km/h) :</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vMax}
                    onChange={(e) => setVMax(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Accélérations :</label>
                  <input
                    type="number"
                    value={accelerations}
                    onChange={(e) => setAccelerations(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Décélérations :</label>
                  <input
                    type="number"
                    value={decelerations}
                    onChange={(e) => setDecelerations(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-450 uppercase">Cardio Moyen (BPM) :</label>
                  <input
                    type="number"
                    value={avgHeartRate}
                    onChange={(e) => setAvgHeartRate(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-450 uppercase">Cardio Max (BPM) :</label>
                  <input
                    type="number"
                    value={peakHeartRate}
                    onChange={(e) => setPeakHeartRate(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Temps zone rouge (min) :</label>
                <input
                  type="number"
                  value={redZoneTime}
                  onChange={(e) => setRedZoneTime(parseInt(e.target.value) || 0)}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                />
              </div>
            </div>

            {/* Technical / Tactical / Prevention column */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1">
                ⚽ 2. Rendement Technique & Tactique
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-450 uppercase">Expected Goals (xG) :</label>
                  <input
                    type="number"
                    step="0.01"
                    value={xG}
                    onChange={(e) => setXG(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-450 uppercase">Expected Assists (xA) :</label>
                  <input
                    type="number"
                    step="0.01"
                    value={xA}
                    onChange={(e) => setXA(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Passes progressives :</label>
                  <input
                    type="number"
                    value={progressivePasses}
                    onChange={(e) => setProgressivePasses(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Réussite sous pression (%) :</label>
                  <input
                    type="number"
                    value={successUnderPressure}
                    onChange={(e) => setSuccessUnderPressure(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Duels gagnés (%) :</label>
                  <input
                    type="number"
                    value={duelsWon}
                    onChange={(e) => setDuelsWon(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Pertes / Récups :</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Pertes"
                      value={turnovers}
                      onChange={(e) => setTurnovers(parseInt(e.target.value) || 0)}
                      required
                      className="w-1/2 rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    />
                    <input
                      type="number"
                      placeholder="Récups"
                      value={recoveries}
                      onChange={(e) => setRecoveries(parseInt(e.target.value) || 0)}
                      required
                      className="w-1/2 rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-450 uppercase">PPDA collectif :</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ppda}
                    onChange={(e) => setPpda(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-450 uppercase">Compacité moyenne (m) :</label>
                  <input
                    type="number"
                    step="0.1"
                    value={compacity}
                    onChange={(e) => setCompacity(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Ratio ACWR :</label>
                  <input
                    type="number"
                    step="0.01"
                    value={acwr}
                    onChange={(e) => setAcwr(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Asymétrie appuis (%) :</label>
                  <input
                    type="number"
                    step="0.1"
                    value={asymmetry}
                    onChange={(e) => setAsymmetry(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase">Perte puissance CMJ (%) :</label>
                <input
                  type="number"
                  step="0.1"
                  value={neuromuscularFatigue}
                  onChange={(e) => setNeuromuscularFatigue(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                />
              </div>
            </div>

          </div>

          {/* Heatmap selection */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <span className="text-[8px] font-black text-zinc-500 dark:text-zinc-455 uppercase block">
              Zone d&apos;influence dominante (Cliquez sur le terrain pour placer le centre) :
            </span>
            <div className="relative aspect-[3/2] w-full max-w-md mx-auto rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner">
              <svg 
                className="w-full h-full bg-[#182a20] cursor-crosshair" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = ((e.clientX - rect.left) / rect.width) * 100
                  const y = ((e.clientY - rect.top) / rect.height) * 100
                  setHeatmapX(Math.round(x))
                  setHeatmapY(Math.round(y))
                }}
              >
                <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
                <line x1="50" y1="2" x2="50" y2="98" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
                <rect x="2" y="25" width="12" height="50" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
                <rect x="86" y="25" width="12" height="50" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
                
                {heatmapX !== null && heatmapY !== null && (
                  <>
                    <defs>
                      <radialGradient id="formHeatGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <circle cx={heatmapX} cy={heatmapY} r="14" fill="url(#formHeatGlow)" />
                    <circle cx={heatmapX} cy={heatmapY} r="2.5" fill="#10B981" stroke="white" strokeWidth="0.5" />
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-950 font-black uppercase text-[10px] tracking-widest py-3 transition-all cursor-pointer text-center"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`flex-1 rounded-xl disabled:opacity-50 text-white font-black uppercase text-[10px] tracking-widest py-3 shadow-md transition-all active:scale-95 cursor-pointer text-center bg-gradient-to-r ${
                editingRecordId 
                  ? "from-amber-500 to-orange-600" 
                  : "from-emerald-500 to-teal-600"
              }`}
            >
              {isPending 
                ? "Enregistrement..." 
                : editingRecordId 
                  ? "Sauvegarder" 
                  : "Valider la session GPS"}
            </button>
          </div>

        </form>

      </div>
    </div>
  )}
</div>
)
}
