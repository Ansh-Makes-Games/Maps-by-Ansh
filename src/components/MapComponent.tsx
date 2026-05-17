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
  style?: 'dark' | 'satellite';
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

export const MapComponent: React.FC<MapComponentProps> = ({ center, zoom, route, style = 'dark', startPoint, endPoint }) => {
  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <AnimatePresence mode="wait">
          {style === 'dark' ? (
            <TileLayer
              key="dark"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          ) : (
            <TileLayer
              key="satellite"
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}
        </AnimatePresence>
        
        <RecenterMap center={center} zoom={zoom} />

        {startPoint && (
          <Marker position={startPoint}>
            <Popup>Start Location</Popup>
          </Marker>
        )}

        {endPoint && (
          <Marker position={endPoint}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {route && (
          <Polyline 
            positions={route.routes[0].geometry.coordinates.map((coord: any) => [coord[1], coord[0]])}
            color="#38bdf8"
            weight={6}
            opacity={0.8}
            lineCap="round"
          />
        )}
      </MapContainer>
    </div>
  );
};
