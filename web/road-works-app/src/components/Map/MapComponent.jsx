import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Configuration du serveur de tuiles
const TILE_SERVER_URL = 'http://localhost:8080'

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

const statusColors = {
  'pending': '#f59e0b',
  'in-progress': '#3b82f6', 
  'completed': '#10b981',
  'cancelled': '#ef4444'
}

const statusLabels = {
  'pending': 'En attente',
  'in-progress': 'En cours',
  'completed': 'Terminé',
  'cancelled': 'Annulé'
}

function MapComponent({ 
  markers = [], 
  center = [-18.8792, 47.5079], 
  zoom = 13,
  height = '400px',
  onMarkerClick,
  onMapClick,
  draggableMarker = false,
  onMarkerDrag,
  showControls = true,
  className = ''
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersLayerRef = useRef(null)
  const draggableMarkerRef = useRef(null)
  const [tileServerAvailable, setTileServerAvailable] = useState(null)

  // Check if TileServer is available
  useEffect(() => {
    const checkTileServer = async () => {
      try {
        const response = await fetch(`${TILE_SERVER_URL}/styles.json`, { 
          method: 'HEAD',
          mode: 'cors'
        })
        setTileServerAvailable(response.ok)
      } catch (error) {
        console.log('TileServer not available, using OpenStreetMap')
        setTileServerAvailable(false)
      }
    }
    checkTileServer()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || tileServerAvailable === null) return

    // Create map
    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: showControls
    }).setView(center, zoom)

    // Add tile layer based on availability
    if (tileServerAvailable) {
      // Use local TileServer-GL
      L.tileLayer(`${TILE_SERVER_URL}/styles/basic-preview/{z}/{x}/{y}.png`, {
        attribution: '© OpenStreetMap contributors | TileServer-GL',
        maxZoom: 19
      }).addTo(mapInstanceRef.current)
      
    } else {
      // Fallback to OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current)
    }

    // Create markers layer
    markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current)

    // Map click handler
    if (onMapClick) {
      mapInstanceRef.current.on('click', (e) => {
        onMapClick(e.latlng)
      })
    }

    // Draggable marker for position selection
    if (draggableMarker) {
      draggableMarkerRef.current = L.marker(center, { 
        draggable: true,
        icon: createCustomIcon('#3b82f6')
      }).addTo(mapInstanceRef.current)
      
      draggableMarkerRef.current.bindPopup('Déplacez-moi pour indiquer l\'emplacement')
      
      draggableMarkerRef.current.on('dragend', (e) => {
        if (onMarkerDrag) {
          onMarkerDrag(e.target.getLatLng())
        }
      })

      // Also allow clicking to move marker
      mapInstanceRef.current.on('click', (e) => {
        draggableMarkerRef.current.setLatLng(e.latlng)
        if (onMarkerDrag) {
          onMarkerDrag(e.latlng)
        }
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [tileServerAvailable])

  // Update markers
  useEffect(() => {
    if (!markersLayerRef.current) return

    // Clear existing markers
    markersLayerRef.current.clearLayers()

    // Add new markers
    markers.forEach(marker => {
      const color = statusColors[marker.status] || '#6b7280'
      const icon = createCustomIcon(color)
      
      const m = L.marker([marker.lat, marker.lng], { icon })
        .addTo(markersLayerRef.current)
      
      // Create popup content
      const popupContent = `
        <div class="map-popup" style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">
            ${marker.title || 'Sans titre'}
          </h4>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="
              display: inline-block;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${color};
            "></span>
            <span style="font-size: 12px; color: ${color}; font-weight: 500;">
              ${statusLabels[marker.status] || marker.status}
            </span>
          </div>
          ${marker.description ? `
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; line-height: 1.4;">
              ${marker.description}
            </p>
          ` : ''}
          ${marker.location ? `
            <div style="font-size: 11px; color: #9ca3af;">
               ${marker.location}
            </div>
          ` : ''}
          ${marker.startDate ? `
            <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">
               ${new Date(marker.startDate).toLocaleDateString('fr-FR')}
              ${marker.endDate ? ` - ${new Date(marker.endDate).toLocaleDateString('fr-FR')}` : ''}
            </div>
          ` : ''}
        </div>
      `
      
      m.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      })

      if (onMarkerClick) {
        m.on('click', () => onMarkerClick(marker))
      }
    })
  }, [markers, onMarkerClick])

  // Update draggable marker position
  useEffect(() => {
    if (draggableMarkerRef.current && center) {
      draggableMarkerRef.current.setLatLng(center)
    }
  }, [center])

  return (
    <div className={`map-wrapper ${className}`}>
      <div 
        ref={mapRef} 
        style={{ 
          height, 
          width: '100%', 
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      />
      {tileServerAvailable === false && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(245, 158, 11, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          zIndex: 1000
        }}>
           Carte en ligne (serveur local indisponible)
        </div>
      )}
    </div>
  )
}

export default MapComponent
