export function loadGoogleMaps(apiKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).google && (window as any).google.maps) {
      resolve((window as any).google);
      return;
    }

    const existing = document.getElementById('google-maps-js');
    if (existing) {
      (existing as HTMLScriptElement).addEventListener('load', () => resolve((window as any).google));
      (existing as HTMLScriptElement).addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve((window as any).google);
    script.onerror = (e) => reject(e);

    document.head.appendChild(script);
  });
}
