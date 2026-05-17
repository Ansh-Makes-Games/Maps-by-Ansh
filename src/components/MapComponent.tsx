import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  route?: any;
  baseLayer?: 'dark' | 'satellite' | 'street';
  showTraffic?: boolean;
  startPoint?: [number, number];
  endPoint?: [number, number];
}

function RecenterMap({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export const MapComponent: React.FC<MapComponentProps> = ({ 
  center, 
  zoom, 
  route, 
  baseLayer = 'dark', 
  showTraffic = false,
  startPoint, 
  endPoint 
}) => {
  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <AnimatePresence mode="wait">
          {baseLayer === 'dark' && (
            <TileLayer
              key="dark"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          )}
          {baseLayer === 'satellite' && (
            <TileLayer
              key="satellite"
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}
          {baseLayer === 'street' && (
            <TileLayer
              key="street"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}
        </AnimatePresence>

        {showTraffic && (
          <TileLayer
            key="traffic"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.memomaps.de/tilegen/{z}/{x}/{y}.png" 
            opacity={0.6}
          />
        )}
        
        <RecenterMap center={center} zoom={zoom} />

        {startPoint && (
          <Marker position={startPoint} icon={L.divIcon({
            className: '',
            html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg shadow-blue-500/50"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })} />
        )}

        {endPoint && (
          <Marker position={endPoint} icon={L.divIcon({
            className: '',
            html: `<div class="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg shadow-red-500/50"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })} />
        )}

        {route && (
          <Polyline 
            positions={route.routes[0].geometry.coordinates.map((coord: any) => [coord[1], coord[0]])}
            color="#3b82f6"
            weight={6}
            opacity={0.8}
            lineCap="round"
          />
        )}
      </MapContainer>
    </div>
  );
};
