import type { LucideIcon } from 'lucide-react';
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
} from 'lucide-react';

export type LocalWeatherSnapshot = {
  latitude: number;
  longitude: number;
  /** 逆地理后的简短位置描述 */
  address: string;
  temperature: number;
  weatherCode: number;
  isDay: 0 | 1;
  description: string;
  Icon: LucideIcon;
};

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('当前环境不支持定位'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 300_000,
    });
  });
}

/**
 * OpenStreetMap Nominatim 逆地理（需合规 User-Agent）
 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    'accept-language': 'zh',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'XinLingSanctuary/1.0 (local weather; no commercial use)',
    },
  });
  if (!res.ok) throw new Error(`逆地理失败 ${res.status}`);
  const data = (await res.json()) as {
    address?: {
      city?: string;
      town?: string;
      village?: string;
      suburb?: string;
      county?: string;
      state?: string;
      country?: string;
    };
    display_name?: string;
  };
  const a = data.address;
  if (a) {
    const locality = a.city || a.town || a.village || a.suburb || a.county;
    const region = a.state || a.country;
    if (locality && region) return `${locality} · ${region}`;
    if (locality) return locality;
  }
  const name = data.display_name?.split(',').slice(0, 3).join('，');
  return name?.trim() || '当前位置';
}

type OpenMeteoCurrent = {
  current_weather?: {
    temperature: number;
    weathercode: number;
    is_day: number;
  };
};

async function fetchOpenMeteoCurrent(lat: number, lon: number): Promise<OpenMeteoCurrent['current_weather']> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current_weather: 'true',
    timezone: 'auto',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`天气接口 ${res.status}`);
  const data = (await res.json()) as OpenMeteoCurrent;
  const cw = data.current_weather;
  if (!cw) throw new Error('无实时天气数据');
  return cw;
}

/**
 * WMO Weather interpretation codes (Open-Meteo)，返回中文简述与图标
 */
export function weatherCodeToVisual(code: number, isDay: boolean): { description: string; Icon: LucideIcon } {
  const day = isDay;
  if (code === 0) {
    return { description: day ? '晴朗' : '晴夜', Icon: day ? Sun : Moon };
  }
  if (code === 1) {
    return { description: day ? '大部晴朗' : '大部晴朗', Icon: day ? CloudSun : CloudMoon };
  }
  if (code === 2) {
    return { description: '少云', Icon: day ? CloudSun : CloudMoon };
  }
  if (code === 3) {
    return { description: '阴天', Icon: Cloud };
  }
  if (code === 45 || code === 48) {
    return { description: '雾', Icon: CloudFog };
  }
  if (code >= 51 && code <= 57) {
    return { description: '毛毛雨', Icon: CloudDrizzle };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { description: code >= 80 ? '阵雨' : '雨', Icon: CloudRain };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { description: '雪', Icon: CloudSnow };
  }
  if (code >= 95 && code <= 99) {
    return { description: '雷暴', Icon: CloudLightning };
  }
  return { description: '多云', Icon: Cloud };
}

/**
 * 获取当前设备定位、当地地址（逆地理）与实时天气（Open-Meteo，无需 API Key）
 */
export async function fetchLocalWeatherAndAddress(): Promise<LocalWeatherSnapshot> {
  const pos = await getCurrentPosition();
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  const [address, cw] = await Promise.all([
    reverseGeocode(lat, lon).catch(() => `约 ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`),
    fetchOpenMeteoCurrent(lat, lon),
  ]);

  const isDay = (cw!.is_day === 1 ? 1 : 0) as 0 | 1;
  const { description, Icon } = weatherCodeToVisual(cw!.weathercode, isDay === 1);

  return {
    latitude: lat,
    longitude: lon,
    address,
    temperature: cw!.temperature,
    weatherCode: cw!.weathercode,
    isDay,
    description,
    Icon,
  };
}
