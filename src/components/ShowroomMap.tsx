import { useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { ExternalLink, MapPin } from 'lucide-react';

// Showroom 4EVER — Ampandrana, Antananarivo, Madagascar
const SHOWROOM_POSITION = { lat: -18.9106, lng: 47.5361 };
const GOOGLE_MAPS_DIRECTIONS_URL =
  'https://www.google.com/maps/search/?api=1&query=Ampandrana,+Antananarivo,+Madagascar';

function ShowroomMarker() {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowOpen, setInfoWindowOpen] = useState(true);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={SHOWROOM_POSITION}
        title="Showroom 4EVER — Ampandrana, Antananarivo"
        onClick={() => setInfoWindowOpen((prev) => !prev)}
      >
        <Pin background="#073D37" borderColor="#ED6F2C" glyphColor="#E4DDD2" scale={1.15} />
      </AdvancedMarker>

      {infoWindowOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={260}
          onCloseClick={() => setInfoWindowOpen(false)}
        >
          <div className="p-1 text-[#172824]">
            <p className="font-display font-bold text-sm text-[#073D37]">4EVER Madagascar</p>
            <p className="text-xs text-[#172824]/80 mt-1">
              Showroom 4EVER — Ampandrana, Antananarivo
            </p>
            <a
              href={GOOGLE_MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#ED6F2C] hover:underline mt-2"
            >
              <span>Ouvrir l&apos;itinéraire</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MapViewport() {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="h-full w-full bg-[#E4DDD2]/50 flex flex-col items-center justify-center p-6 text-center">
        <MapPin className="w-8 h-8 text-[#073D37] mb-3" />
        <p className="font-display font-semibold text-base text-[#073D37]">
          Showroom 4EVER — Ampandrana, Antananarivo
        </p>
        <p className="text-xs text-[#172824]/75 mt-1 max-w-sm">
          La carte interactive n&apos;a pas pu être chargée pour le moment. Vous pouvez ouvrir directement l&apos;emplacement dans Google Maps.
        </p>
        <a
          href={GOOGLE_MAPS_DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] transition-colors"
        >
          <span>Ouvrir dans Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <GoogleMap
      mapId="DEMO_MAP_ID"
      defaultCenter={SHOWROOM_POSITION}
      defaultZoom={16}
      gestureHandling="cooperative"
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      className="w-full h-full"
    >
      <ShowroomMarker />
    </GoogleMap>
  );
}

export function ShowroomMap() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="rounded-lg overflow-hidden border border-[#073D37]/15 bg-white">
      <div className="h-[380px] sm:h-[420px] w-full relative">
        {apiKey ? (
          <APIProvider apiKey={apiKey} libraries={['marker']} language="fr" region="MG">
            <MapViewport />
          </APIProvider>
        ) : (
          <div className="h-full w-full bg-[#E4DDD2]/50 flex flex-col items-center justify-center p-6 text-center">
            <MapPin className="w-8 h-8 text-[#073D37] mb-3" />
            <p className="font-display font-semibold text-base text-[#073D37]">
              Showroom 4EVER — Ampandrana, Antananarivo, Madagascar
            </p>
            <p className="text-xs text-[#172824]/75 mt-1 max-w-md">
              Clé Google Maps Platform non détectée dans l&apos;environnement client. Accédez directement au point Showroom sur Google Maps.
            </p>
            <a
              href={GOOGLE_MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] transition-colors"
            >
              <span>Voir l&apos;itinéraire Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-[#073D37]/10 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#172824]/75">
          Showroom 4EVER — Ampandrana, Antananarivo, Madagascar
        </p>
        <a
          href={GOOGLE_MAPS_DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#073D37] hover:text-[#ED6F2C] transition-colors"
        >
          <span>Ouvrir dans Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
