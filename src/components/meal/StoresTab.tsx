import React from 'react';
import NearbyStores from '@/components/meal/NearbyStores';

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  locationLoading?: boolean;
  groceryItems: string[];
}

const StoresTab: React.FC<Props> = ({ latitude, longitude, locationLoading, groceryItems }) => {
  if (latitude && longitude && !locationLoading) {
    return <NearbyStores latitude={latitude} longitude={longitude} radiusInKm={5} ingredients={groceryItems} />;
  }

  if (locationLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Getting your location...</p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium mb-2">Location Required</h3>
      <p className="text-gray-500 mb-6">Please enable location access to find nearby stores.</p>
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  );
};

export default StoresTab;
