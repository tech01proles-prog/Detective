import { X, MapPin } from 'lucide-react';
import { Location } from '../types';
import { clsx } from '../utils/api';

interface CityMapModalProps {
  locations: Location[];
  currentLocationId: string;
  visitedLocations: string[];
  onTravel: (locationId: string) => void;
  onClose: () => void;
  mapImage?: string;
}

export function CityMapModal({
  locations,
  currentLocationId,
  visitedLocations,
  onTravel,
  onClose,
  mapImage
}: CityMapModalProps) {
  const currentLocation = locations.find(l => l.id === currentLocationId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-noir-900 border border-noir-700 rounded-lg max-w-5xl w-full max-h-[85vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-noir-700 flex items-center justify-between">
          <h2 className="text-xl font-serif text-accent-gold">City Map</h2>
          <button onClick={onClose} className="p-2 hover:bg-noir-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Map Content */}
        <div className="flex h-[65vh]">
          {/* Map Visual */}
          <div className="flex-1 relative bg-noir-950 overflow-hidden">
            {mapImage ? (
              <div className="absolute inset-0">
                <img 
                  src={mapImage} 
                  alt="City Map"
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-noir-900 to-noir-950" />
            )}

            {/* Location Points */}
            <div className="absolute inset-0">
              {locations.map(location => {
                const isCurrent = location.id === currentLocationId;
                const isVisited = visitedLocations.includes(location.id);
                const isLocked = location.locked;

                return (
                  <div
                    key={location.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{
                      left: `${location.mapPosition.x}%`,
                      top: `${location.mapPosition.y}%`
                    }}
                  >
                    {/* Connection Lines */}
                    {location.connections.map(connId => {
                      const connLoc = locations.find(l => l.id === connId);
                      if (!connLoc) return null;
                      
                      return (
                        <svg
                          key={connId}
                          className="absolute top-1/2 left-1/2 w-32 h-32 pointer-events-none -z-10"
                          style={{
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          <line
                            x1="50%"
                            y1="50%"
                            x2={`${((connLoc.mapPosition.x - location.mapPosition.x) / 100 * 300 + 50)}%`}
                            y2={`${((connLoc.mapPosition.y - location.mapPosition.y) / 100 * 300 + 50)}%`}
                            stroke={isVisited && !isLocked ? '#c9a959' : '#495057'}
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.5"
                          />
                        </svg>
                      );
                    })}

                    {/* Map Point */}
                    <button
                      onClick={() => !isLocked && onTravel(location.id)}
                      disabled={isLocked}
                      className={clsx(
                        "map-point relative",
                        isCurrent && "active",
                        isVisited && !isCurrent && "visited",
                        isLocked && "bg-noir-700 cursor-not-allowed"
                      )}
                      title={location.name}
                    >
                      {isLocked && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-noir-500 whitespace-nowrap">
                          🔒 Locked
                        </span>
                      )}
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-noir-800 border border-noir-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none min-w-[150px] z-20">
                        <h4 className="font-serif text-accent-gold text-sm">{location.name}</h4>
                        <p className="text-xs text-noir-400 mt-1 line-clamp-2">{location.description}</p>
                        {isVisited && (
                          <span className="text-xs text-noir-500 mt-1 block">✓ Visited</span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location Info Panel */}
          <div className="w-72 border-l border-noir-700 overflow-y-auto p-4 bg-noir-900">
            <h3 className="text-sm text-noir-400 uppercase tracking-wider mb-4">Locations</h3>
            
            <div className="space-y-2">
              {locations.map(location => {
                const isCurrent = location.id === currentLocationId;
                const isVisited = visitedLocations.includes(location.id);
                const isLocked = location.locked;

                return (
                  <button
                    key={location.id}
                    onClick={() => !isLocked && onTravel(location.id)}
                    disabled={isLocked}
                    className={clsx(
                      "w-full p-3 text-left rounded-lg border transition-all",
                      isCurrent
                        ? "bg-accent-gold/10 border-accent-gold"
                        : isLocked
                          ? "bg-noir-800 border-noir-700 opacity-50 cursor-not-allowed"
                          : "bg-noir-800 border-noir-700 hover:border-accent-gold"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className={clsx(
                        isCurrent ? "text-accent-gold" : "text-noir-500"
                      )} />
                      <span className={clsx(
                        "font-serif text-sm",
                        isCurrent ? "text-accent-gold" : "text-noir-200"
                      )}>
                        {location.name}
                      </span>
                    </div>
                    {isVisited && (
                      <div className="mt-1 text-xs text-noir-500">Last visited</div>
                    )}
                    {isLocked && (
                      <div className="mt-1 text-xs text-noir-600">🔒 Requires condition</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current Location Details */}
            {currentLocation && (
              <div className="mt-6 pt-4 border-t border-noir-700">
                <h4 className="text-xs text-noir-500 uppercase tracking-wider mb-2">
                  Current Location
                </h4>
                <h3 className="font-serif text-accent-gold">{currentLocation.name}</h3>
                <p className="text-sm text-noir-400 mt-2 leading-relaxed">
                  {currentLocation.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
