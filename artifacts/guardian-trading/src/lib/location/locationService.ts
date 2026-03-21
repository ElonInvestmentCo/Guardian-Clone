/**
 * Location service — Country → State → City cascade.
 * Single source of truth for all location dropdowns.
 * Results are memo-cached in module scope.
 */

export interface LocationOption {
  code: string;
  label: string;
}

const COUNTRIES: LocationOption[] = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "IN", label: "India" },
  { code: "JP", label: "Japan" },
  { code: "MX", label: "Mexico" },
  { code: "BR", label: "Brazil" },
  { code: "SG", label: "Singapore" },
  { code: "HK", label: "Hong Kong" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "CH", label: "Switzerland" },
  { code: "OTHER", label: "Other" },
];

const STATES_BY_COUNTRY: Record<string, LocationOption[]> = {
  US: [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
    "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
    "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
    "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
    "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
    "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
    "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
  ].map((s) => ({ code: s, label: s })),

  CA: [
    { code: "AB", label: "Alberta" },
    { code: "BC", label: "British Columbia" },
    { code: "MB", label: "Manitoba" },
    { code: "NB", label: "New Brunswick" },
    { code: "NL", label: "Newfoundland and Labrador" },
    { code: "NS", label: "Nova Scotia" },
    { code: "ON", label: "Ontario" },
    { code: "PE", label: "Prince Edward Island" },
    { code: "QC", label: "Quebec" },
    { code: "SK", label: "Saskatchewan" },
  ],

  GB: [
    { code: "ENG", label: "England" },
    { code: "SCT", label: "Scotland" },
    { code: "WLS", label: "Wales" },
    { code: "NIR", label: "Northern Ireland" },
  ],

  AU: [
    { code: "NSW", label: "New South Wales" },
    { code: "VIC", label: "Victoria" },
    { code: "QLD", label: "Queensland" },
    { code: "WA",  label: "Western Australia" },
    { code: "SA",  label: "South Australia" },
    { code: "TAS", label: "Tasmania" },
    { code: "ACT", label: "Australian Capital Territory" },
    { code: "NT",  label: "Northern Territory" },
  ],

  DE: [
    { code: "BE", label: "Berlin" },
    { code: "BY", label: "Bavaria" },
    { code: "NW", label: "North Rhine-Westphalia" },
    { code: "HH", label: "Hamburg" },
    { code: "HE", label: "Hesse" },
    { code: "BW", label: "Baden-Württemberg" },
    { code: "SN", label: "Saxony" },
    { code: "RP", label: "Rhineland-Palatinate" },
  ],

  FR: [
    { code: "IDF", label: "Île-de-France" },
    { code: "ARA", label: "Auvergne-Rhône-Alpes" },
    { code: "HDF", label: "Hauts-de-France" },
    { code: "NAQ", label: "Nouvelle-Aquitaine" },
    { code: "OCC", label: "Occitanie" },
    { code: "PAC", label: "Provence-Alpes-Côte d'Azur" },
    { code: "GES", label: "Grand Est" },
    { code: "BRE", label: "Brittany" },
  ],

  IN: [
    { code: "MH", label: "Maharashtra" },
    { code: "DL", label: "Delhi" },
    { code: "KA", label: "Karnataka" },
    { code: "TN", label: "Tamil Nadu" },
    { code: "UP", label: "Uttar Pradesh" },
    { code: "GJ", label: "Gujarat" },
    { code: "WB", label: "West Bengal" },
    { code: "RJ", label: "Rajasthan" },
    { code: "TS", label: "Telangana" },
    { code: "AP", label: "Andhra Pradesh" },
  ],
};

const CITIES_BY_STATE: Record<string, string[]> = {
  Alabama: ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa"],
  Alaska: ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan"],
  Arizona: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe"],
  Arkansas: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro"],
  California: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Anaheim", "Irvine", "Riverside", "Bakersfield"],
  Colorado: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Boulder"],
  Connecticut: ["Bridgeport", "New Haven", "Hartford", "Stamford", "Waterbury", "Norwalk"],
  Delaware: ["Wilmington", "Dover", "Newark", "Middletown"],
  Florida: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Tallahassee", "Fort Lauderdale", "Cape Coral", "West Palm Beach", "Gainesville"],
  Georgia: ["Atlanta", "Columbus", "Augusta", "Macon", "Savannah", "Athens"],
  Hawaii: ["Honolulu", "Pearl City", "Hilo", "Kailua"],
  Idaho: ["Boise", "Nampa", "Meridian", "Idaho Falls", "Pocatello"],
  Illinois: ["Chicago", "Aurora", "Joliet", "Naperville", "Rockford", "Springfield"],
  Indiana: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel"],
  Iowa: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City"],
  Kansas: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka"],
  Kentucky: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington"],
  Louisiana: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"],
  Maine: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn"],
  Maryland: ["Baltimore", "Rockville", "Frederick", "Gaithersburg", "Annapolis"],
  Massachusetts: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell", "Brockton", "Quincy"],
  Michigan: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing", "Flint"],
  Minnesota: ["Minneapolis", "Saint Paul", "Rochester", "Duluth", "Bloomington"],
  Mississippi: ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi"],
  Missouri: ["Kansas City", "Saint Louis", "Springfield", "Columbia", "Independence"],
  Montana: ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte"],
  Nebraska: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney"],
  Nevada: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks"],
  "New Hampshire": ["Manchester", "Nashua", "Concord", "Dover", "Rochester"],
  "New Jersey": ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Toms River", "Trenton"],
  "New Mexico": ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell"],
  "New York": ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany"],
  "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville"],
  "North Dakota": ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo"],
  Ohio: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"],
  Oklahoma: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton"],
  Oregon: ["Portland", "Eugene", "Salem", "Gresham", "Hillsboro", "Bend"],
  Pennsylvania: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Harrisburg"],
  "Rhode Island": ["Providence", "Cranston", "Warwick", "Pawtucket", "East Providence"],
  "South Carolina": ["Columbia", "Charleston", "North Charleston", "Mount Pleasant", "Greenville"],
  "South Dakota": ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown"],
  Tennessee: ["Memphis", "Nashville", "Knoxville", "Chattanooga", "Clarksville"],
  Texas: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo"],
  Utah: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem"],
  Vermont: ["Burlington", "South Burlington", "Rutland", "Barre", "Montpelier"],
  Virginia: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Arlington"],
  Washington: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kirkland"],
  "West Virginia": ["Charleston", "Huntington", "Parkersburg", "Morgantown", "Wheeling"],
  Wisconsin: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine"],
  Wyoming: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs"],
  AB: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert"],
  BC: ["Vancouver", "Surrey", "Burnaby", "Richmond", "Abbotsford", "Victoria"],
  MB: ["Winnipeg", "Brandon", "Steinbach", "Thompson"],
  NB: ["Moncton", "Saint John", "Fredericton", "Miramichi"],
  NL: ["St. John's", "Mount Pearl", "Corner Brook", "Gander"],
  NS: ["Halifax", "Dartmouth", "Sydney", "Truro"],
  ON: ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan"],
  PE: ["Charlottetown", "Summerside", "Stratford"],
  QC: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil"],
  SK: ["Saskatoon", "Regina", "Prince Albert", "Moose Jaw"],
  ENG: ["London", "Birmingham", "Manchester", "Leeds", "Liverpool", "Sheffield", "Bristol", "Newcastle"],
  SCT: ["Glasgow", "Edinburgh", "Aberdeen", "Dundee", "Inverness"],
  WLS: ["Cardiff", "Swansea", "Newport", "Wrexham"],
  NIR: ["Belfast", "Derry", "Lisburn", "Newry"],
  NSW: ["Sydney", "Newcastle", "Wollongong", "Central Coast"],
  VIC: ["Melbourne", "Geelong", "Ballarat", "Bendigo"],
  QLD: ["Brisbane", "Gold Coast", "Sunshine Coast", "Townsville"],
  WA: ["Perth", "Fremantle", "Bunbury", "Joondalup"],
  SA: ["Adelaide", "Mount Gambier", "Whyalla"],
  TAS: ["Hobart", "Launceston", "Devonport"],
  ACT: ["Canberra", "Belconnen", "Tuggeranong"],
  NT: ["Darwin", "Alice Springs", "Palmerston"],
  BE: ["Berlin", "Potsdam"],
  BY: ["Munich", "Nuremberg", "Augsburg", "Regensburg"],
  NW: ["Cologne", "Düsseldorf", "Dortmund", "Essen", "Duisburg"],
  HH: ["Hamburg"],
  HE: ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt"],
  BW: ["Stuttgart", "Karlsruhe", "Freiburg", "Heidelberg"],
  SN: ["Dresden", "Leipzig", "Chemnitz"],
  RP: ["Mainz", "Ludwigshafen", "Koblenz", "Trier"],
  IDF: ["Paris", "Versailles", "Boulogne-Billancourt"],
  ARA: ["Lyon", "Grenoble", "Clermont-Ferrand"],
  HDF: ["Lille", "Amiens", "Roubaix"],
  NAQ: ["Bordeaux", "Limoges", "Poitiers"],
  OCC: ["Toulouse", "Montpellier", "Nîmes"],
  PAC: ["Marseille", "Nice", "Toulon", "Aix-en-Provence"],
  GES: ["Strasbourg", "Reims", "Metz", "Nancy"],
  BRE: ["Rennes", "Brest", "Quimper"],
  MH: ["Mumbai", "Pune", "Nagpur", "Thane", "Navi Mumbai"],
  DL: ["New Delhi", "Noida", "Gurgaon", "Faridabad"],
  KA: ["Bangalore", "Mysore", "Mangalore", "Hubli"],
  TN: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  UP: ["Lucknow", "Kanpur", "Agra", "Varanasi", "Allahabad"],
  GJ: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  WB: ["Kolkata", "Howrah", "Asansol", "Siliguri"],
  RJ: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Udaipur"],
  TS: ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad"],
  AP: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore"],
};

const cache: { countries?: LocationOption[]; states?: Record<string, LocationOption[]>; cities?: Record<string, string[]> } = {};

/** Returns all countries sorted with US first */
export function getCountries(): LocationOption[] {
  if (cache.countries) return cache.countries;
  cache.countries = COUNTRIES;
  return cache.countries;
}

/** Returns states/provinces for a country code. Returns [] if unsupported. */
export function getStates(countryCode: string): LocationOption[] {
  if (!cache.states) cache.states = STATES_BY_COUNTRY;
  return cache.states[countryCode] ?? [];
}

/**
 * Returns cities for a state code.
 * The state code must match the LocationOption.code from getStates().
 */
export function getCities(stateCode: string): string[] {
  if (!cache.cities) cache.cities = CITIES_BY_STATE;
  return cache.cities[stateCode] ?? [];
}
