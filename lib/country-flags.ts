const COUNTRY_FLAGS: Record<string, string> = {
  'Afghanistan': '🇦🇫', 'Albania': '🇦🇱', 'Algeria': '🇩🇿', 'Argentina': '🇦🇷',
  'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Bangladesh': '🇧🇩', 'Belgium': '🇧🇪',
  'Belize': '🇧🇿', 'Bolivia': '🇧🇴', 'Brazil': '🇧🇷', 'Cambodia': '🇰🇭',
  'Canada': '🇨🇦', 'Chile': '🇨🇱', 'China': '🇨🇳', 'Colombia': '🇨🇴',
  'Costa Rica': '🇨🇷', 'Croatia': '🇭🇷', 'Cuba': '🇨🇺', 'Czech Republic': '🇨🇿',
  'Czechia': '🇨🇿', 'Denmark': '🇩🇰', 'Dominican Republic': '🇩🇴',
  'Ecuador': '🇪🇨', 'Egypt': '🇪🇬', 'El Salvador': '🇸🇻', 'Estonia': '🇪🇪',
  'Ethiopia': '🇪🇹', 'Fiji': '🇫🇯', 'Finland': '🇫🇮', 'France': '🇫🇷',
  'Georgia': '🇬🇪', 'Germany': '🇩🇪', 'Ghana': '🇬🇭', 'Greece': '🇬🇷',
  'Guatemala': '🇬🇹', 'Honduras': '🇭🇳', 'Hong Kong': '🇭🇰', 'Hungary': '🇭🇺',
  'Iceland': '🇮🇸', 'India': '🇮🇳', 'Indonesia': '🇮🇩', 'Iran': '🇮🇷',
  'Iraq': '🇮🇶', 'Ireland': '🇮🇪', 'Israel': '🇮🇱', 'Italy': '🇮🇹',
  'Jamaica': '🇯🇲', 'Japan': '🇯🇵', 'Jordan': '🇯🇴', 'Kazakhstan': '🇰🇿',
  'Kenya': '🇰🇪', 'Laos': '🇱🇦', 'Latvia': '🇱🇻', 'Lebanon': '🇱🇧',
  'Lithuania': '🇱🇹', 'Luxembourg': '🇱🇺', 'Macau': '🇲🇴', 'Malaysia': '🇲🇾',
  'Maldives': '🇲🇻', 'Malta': '🇲🇹', 'Mexico': '🇲🇽', 'Mongolia': '🇲🇳',
  'Montenegro': '🇲🇪', 'Morocco': '🇲🇦', 'Myanmar': '🇲🇲', 'Nepal': '🇳🇵',
  'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿', 'Nicaragua': '🇳🇮', 'Nigeria': '🇳🇬',
  'North Korea': '🇰🇵', 'Norway': '🇳🇴', 'Oman': '🇴🇲', 'Pakistan': '🇵🇰',
  'Panama': '🇵🇦', 'Paraguay': '🇵🇾', 'Peru': '🇵🇪', 'Philippines': '🇵🇭',
  'Poland': '🇵🇱', 'Portugal': '🇵🇹', 'Qatar': '🇶🇦', 'Romania': '🇷🇴',
  'Russia': '🇷🇺', 'Rwanda': '🇷🇼', 'Saudi Arabia': '🇸🇦', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Senegal': '🇸🇳', 'Serbia': '🇷🇸', 'Singapore': '🇸🇬', 'Slovakia': '🇸🇰',
  'Slovenia': '🇸🇮', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Spain': '🇪🇸',
  'Sri Lanka': '🇱🇰', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Taiwan': '🇹🇼',
  'Tanzania': '🇹🇿', 'Thailand': '🇹🇭', 'Tunisia': '🇹🇳', 'Turkey': '🇹🇷',
  'Türkiye': '🇹🇷', 'UAE': '🇦🇪', 'United Arab Emirates': '🇦🇪',
  'UK': '🇬🇧', 'United Kingdom': '🇬🇧', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'USA': '🇺🇸', 'United States': '🇺🇸', 'US': '🇺🇸',
  'Uruguay': '🇺🇾', 'Uzbekistan': '🇺🇿', 'Venezuela': '🇻🇪',
  'Vietnam': '🇻🇳', 'Viet Nam': '🇻🇳', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Zimbabwe': '🇿🇼',
};

export function flagForCountry(country: string): string {
  if (!country) return '';
  const direct = COUNTRY_FLAGS[country];
  if (direct) return direct;
  const lower = country.toLowerCase();
  for (const [k, v] of Object.entries(COUNTRY_FLAGS)) {
    if (k.toLowerCase() === lower) return v;
  }
  return '';
}
