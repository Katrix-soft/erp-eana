import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-cns-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-950">
      <div #mapContainer class="w-full h-full"></div>
      
      <!-- Overlay Legend -->
      <div class="absolute bottom-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Operativo</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
          <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Novedad</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
          <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Falla / FS</span>
        </div>
      </div>

      <!-- Map Title Overlay -->
      <div class="absolute top-4 left-4 z-[1000] flex items-center gap-3">
         <div class="bg-blue-600/20 backdrop-blur-md px-4 py-2 rounded-xl border border-blue-500/20 flex items-center gap-2">
            <span class="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Mapa Estratégico CNS</span>
         </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .leaflet-container { background: #020617; }
    .custom-marker {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class CnsMapComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() airports: any[] = [];

  private map?: L.Map;
  private markers: L.Marker[] = [];

  ngOnInit() { }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['airports'] && this.map) {
      this.updateMarkers();
    }
  }

  private initMap() {
    // Center of Argentina approximately
    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: false,
      attributionControl: false
    }).setView([-38.4161, -63.6167], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.updateMarkers();
  }

  private updateMarkers() {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    this.airports.forEach(airport => {
      if (airport.latitud && airport.longitud) {
        const statusColor = airport.availability >= 95 ? '#10b981' : (airport.availability >= 80 ? '#f59e0b' : '#ef4444');
        const glowColor = airport.availability >= 95 ? 'rgba(16,185,129,0.4)' : (airport.availability >= 80 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)');

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="
              width: 14px; 
              height: 14px; 
              background-color: ${statusColor}; 
              border: 2px solid rgba(255,255,255,0.8);
              border-radius: 50%; 
              box-shadow: 0 0 10px ${glowColor}, 0 0 20px ${glowColor};
              animation: pulse 2s infinite;
            "></div>
            <style>
              @keyframes pulse {
                0% { transform: scale(0.95); opacity: 1; }
                50% { transform: scale(1.15); opacity: 0.8; }
                100% { transform: scale(0.95); opacity: 1; }
              }
            </style>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const marker = L.marker([Number(airport.latitud), Number(airport.longitud)], { icon })
          .addTo(this.map!)
          .bindPopup(`
            <div style="background: #0f172a; color: white; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
              <h4 style="margin: 0 0 5px 0; font-weight: 900; text-transform: uppercase; font-family: sans-serif; letter-spacing: 1px;">${airport.name}</h4>
              <p style="margin: 0; font-size: 10px; font-weight: bold; color: ${statusColor};">DISPONIBILIDAD: ${airport.availability}%</p>
              <p style="margin: 5px 0 0 0; font-size: 9px; opacity: 0.7;">Equipos: ${airport.totalEquipments}</p>
            </div>
          `, { className: 'custom-popup' });

        this.markers.push(marker);
      }
    });

    // Auto-zoom to fit markers if we have many
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }
}
