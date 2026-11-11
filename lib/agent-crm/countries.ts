/** Shared ISO 3166-1 alpha-2 reference: country/territory names shown in UI, codes stored in CRM.
 * No country table, network lookup or runtime Intl.DisplayNames dependency is required.
 * Existing free-text values are read compatibly and may be migrated separately.
 */
const COUNTRY_DATA = `AW|Aruba
AF|Afghanistan
AO|Angola
AI|Anguilla
AX|Åland Islands
AL|Albania
AD|Andorra
AE|United Arab Emirates
AR|Argentina
AM|Armenia
AS|American Samoa
AQ|Antarctica
TF|French Southern Territories
AG|Antigua and Barbuda
AU|Australia
AT|Austria
AZ|Azerbaijan
BI|Burundi
BE|Belgium
BJ|Benin
BQ|Bonaire, Sint Eustatius and Saba
BF|Burkina Faso
BD|Bangladesh
BG|Bulgaria
BH|Bahrain
BS|Bahamas
BA|Bosnia and Herzegovina
BL|Saint Barthélemy
BY|Belarus
BZ|Belize
BM|Bermuda
BO|Bolivia
BR|Brazil
BB|Barbados
BN|Brunei
BT|Bhutan
BV|Bouvet Island
BW|Botswana
CF|Central African Republic
CA|Canada
CC|Cocos (Keeling) Islands
CH|Switzerland
CL|Chile
CN|China
CI|Côte d’Ivoire
CM|Cameroon
CD|Democratic Republic of the Congo
CG|Republic of the Congo
CK|Cook Islands
CO|Colombia
KM|Comoros
CV|Cape Verde
CR|Costa Rica
CU|Cuba
CW|Curaçao
CX|Christmas Island
KY|Cayman Islands
CY|Cyprus
CZ|Czechia
DE|Germany
DJ|Djibouti
DM|Dominica
DK|Denmark
DO|Dominican Republic
DZ|Algeria
EC|Ecuador
EG|Egypt
ER|Eritrea
EH|Western Sahara
ES|Spain
EE|Estonia
ET|Ethiopia
FI|Finland
FJ|Fiji
FK|Falkland Islands (Malvinas)
FR|France
FO|Faroe Islands
FM|Micronesia
GA|Gabon
GB|United Kingdom
GE|Georgia
GG|Guernsey
GH|Ghana
GI|Gibraltar
GN|Guinea
GP|Guadeloupe
GM|Gambia
GW|Guinea-Bissau
GQ|Equatorial Guinea
GR|Greece
GD|Grenada
GL|Greenland
GT|Guatemala
GF|French Guiana
GU|Guam
GY|Guyana
HK|Hong Kong
HM|Heard Island and McDonald Islands
HN|Honduras
HR|Croatia
HT|Haiti
HU|Hungary
ID|Indonesia
IM|Isle of Man
IN|India
IO|British Indian Ocean Territory
IE|Ireland
IR|Iran
IQ|Iraq
IS|Iceland
IL|Israel
IT|Italy
JM|Jamaica
JE|Jersey
JO|Jordan
JP|Japan
KZ|Kazakhstan
KE|Kenya
KG|Kyrgyzstan
KH|Cambodia
KI|Kiribati
KN|Saint Kitts and Nevis
KR|South Korea
KW|Kuwait
LA|Laos
LB|Lebanon
LR|Liberia
LY|Libya
LC|Saint Lucia
LI|Liechtenstein
LK|Sri Lanka
LS|Lesotho
LT|Lithuania
LU|Luxembourg
LV|Latvia
MO|Macao
MF|Saint Martin (French part)
MA|Morocco
MC|Monaco
MD|Moldova
MG|Madagascar
MV|Maldives
MX|Mexico
MH|Marshall Islands
MK|North Macedonia
ML|Mali
MT|Malta
MM|Myanmar
ME|Montenegro
MN|Mongolia
MP|Northern Mariana Islands
MZ|Mozambique
MR|Mauritania
MS|Montserrat
MQ|Martinique
MU|Mauritius
MW|Malawi
MY|Malaysia
YT|Mayotte
NA|Namibia
NC|New Caledonia
NE|Niger
NF|Norfolk Island
NG|Nigeria
NI|Nicaragua
NU|Niue
NL|Netherlands
NO|Norway
NP|Nepal
NR|Nauru
NZ|New Zealand
OM|Oman
PK|Pakistan
PA|Panama
PN|Pitcairn
PE|Peru
PH|Philippines
PW|Palau
PG|Papua New Guinea
PL|Poland
PR|Puerto Rico
KP|North Korea
PT|Portugal
PY|Paraguay
PS|Palestine
PF|French Polynesia
QA|Qatar
RE|Réunion
RO|Romania
RU|Russia
RW|Rwanda
SA|Saudi Arabia
SD|Sudan
SN|Senegal
SG|Singapore
GS|South Georgia and the South Sandwich Islands
SH|Saint Helena, Ascension and Tristan da Cunha
SJ|Svalbard and Jan Mayen
SB|Solomon Islands
SL|Sierra Leone
SV|El Salvador
SM|San Marino
SO|Somalia
PM|Saint Pierre and Miquelon
RS|Serbia
SS|South Sudan
ST|Sao Tome and Principe
SR|Suriname
SK|Slovakia
SI|Slovenia
SE|Sweden
SZ|Eswatini
SX|Sint Maarten (Dutch part)
SC|Seychelles
SY|Syria
TC|Turks and Caicos Islands
TD|Chad
TG|Togo
TH|Thailand
TJ|Tajikistan
TK|Tokelau
TM|Turkmenistan
TL|Timor-Leste
TO|Tonga
TT|Trinidad and Tobago
TN|Tunisia
TR|Türkiye
TV|Tuvalu
TW|Taiwan
TZ|Tanzania
UG|Uganda
UA|Ukraine
UM|United States Minor Outlying Islands
UY|Uruguay
US|United States
UZ|Uzbekistan
VA|Vatican City
VC|Saint Vincent and the Grenadines
VE|Venezuela
VG|British Virgin Islands
VI|U.S. Virgin Islands
VN|Vietnam
VU|Vanuatu
WF|Wallis and Futuna
WS|Samoa
YE|Yemen
ZA|South Africa
ZM|Zambia
ZW|Zimbabwe`;

export const COUNTRIES: ReadonlyArray<{ code: string; name: string }> = COUNTRY_DATA
  .split('\n').map(line => {
    const separator = line.indexOf('|');
    return { code: line.slice(0, separator), name: line.slice(separator + 1) };
  }).sort((a, b) => a.name.localeCompare(b.name, 'en'));

export const UNSPECIFIED_COUNTRY = '__unspecified__';
export const UNRECOGNIZED_COUNTRY = '__unrecognized__';

// Recognize common historical free-text names and alternative country spellings.
const ALIASES: Readonly<Record<string, string>> = {
  uk: 'GB', 'great britain': 'GB', britain: 'GB', england: 'GB',
  usa: 'US', 'u.s.a.': 'US', 'united states of america': 'US', 'u.s.': 'US',
  uae: 'AE', 'u.a.e.': 'AE', 'republic of kenya': 'KE',
  'czech republic': 'CZ', 'ivory coast': 'CI', 'cote d ivoire': 'CI',
  'cape verde': 'CV', 'cabo verde': 'CV', 'the gambia': 'GM',
  'drc': 'CD', 'dr congo': 'CD', 'congo drc': 'CD', 'congo-kinshasa': 'CD',
  'congo-brazzaville': 'CG',
  'republic of korea': 'KR', 'korea south': 'KR',
  'democratic people\'s republic of korea': 'KP', 'korea north': 'KP',
  'russian federation': 'RU', turkey: 'TR', swaziland: 'SZ',
  'united republic of tanzania': 'TZ', 'brunei darussalam': 'BN',
  'lao people\'s democratic republic': 'LA', 'syrian arab republic': 'SY',
  'viet nam': 'VN', 'bolivia plurinational state of': 'BO',
  'venezuela bolivarian republic of': 'VE', 'moldova republic of': 'MD',
  'iran islamic republic of': 'IR', 'taiwan province of china': 'TW',
  macau: 'MO', 'palestinian territories': 'PS', 'state of palestine': 'PS',
  'tanzania united republic of': 'TZ', 'holy see': 'VA',
  'north macedonia republic of': 'MK',
};

export function countryKey(value: string): string {
  return value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '').replace(/\s+/g, ' ').toLowerCase();
}
const codeByKey = new Map<string, string>();
for (const item of COUNTRIES) {
  codeByKey.set(countryKey(item.name), item.code);
  codeByKey.set(item.code.toLowerCase(), item.code);
}
for (const [name, code] of Object.entries(ALIASES)) codeByKey.set(countryKey(name), code);

export function countryCode(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return codeByKey.get(countryKey(value)) ?? null;
}

export function countryName(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  const code = countryCode(value);
  return code ? COUNTRIES.find(item => item.code === code)!.name : value.trim();
}

export function countrySearchMatches(value: string, query: string): boolean {
  if (!query.trim()) return true;
  const code = countryCode(value);
  const search = countryKey(query);
  return countryKey(countryName(value)).includes(search)
    || value.toLowerCase().includes(search)
    || (code ? Object.entries(ALIASES).some(([alias, mapped]) =>
      mapped === code && countryKey(alias).includes(search)) : false);
}

/** Codes and historical names, for parameterized SQL matching before a data migration. */
export function countryFilterTerms(codes: readonly string[]): string[] {
  const wanted = new Set(codes);
  const values = [
    ...COUNTRIES.filter(item => wanted.has(item.code))
      .flatMap(item => [item.code, item.name]),
    ...Object.entries(ALIASES).filter(([, code]) => wanted.has(code)).map(([name]) => name),
  ];
  return [...new Set(values.flatMap(value => [value.toLowerCase(), countryKey(value)]))];
}
export function countryCountMap(rows: readonly {country: string | null; count: number}[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const code = countryCode(row.country);
    const key = code ?? (row.country?.trim() ? UNRECOGNIZED_COUNTRY : UNSPECIFIED_COUNTRY);
    counts[key] = (counts[key] ?? 0) + row.count;
  }
  return counts;
}
