import { LocationGeo } from '../types';

export const LOCATIONS: LocationGeo[] = [
  {
    state: 'Telangana',
    district: 'Hyderabad',
    lat: 17.3850,
    lng: 78.4867,
    industrialZone: 'HITEC City, Genome Valley, Aerospace Park Adibatla',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Telangana',
    district: 'Medchal-Malkajgiri',
    lat: 17.6297,
    lng: 78.4814,
    industrialZone: 'Mallapur, Cherlapally Industrial Area, Bio-Pharma Hub',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    lat: 12.9716,
    lng: 77.5946,
    industrialZone: 'Electronic City, Whitefield Tech Corridor, Peenya Industrial Complex',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Karnataka',
    district: 'Mysuru',
    lat: 12.2958,
    lng: 76.6394,
    industrialZone: 'Hebbal Industrial Estate, Koorgalli Electronics Cluster',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Maharashtra',
    district: 'Pune',
    lat: 18.5204,
    lng: 73.8567,
    industrialZone: 'Chakan Auto Cluster, Bhosari MIDC, Hinjawadi Infotech Park',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Maharashtra',
    district: 'Thane',
    lat: 19.2183,
    lng: 72.9781,
    industrialZone: 'Wagle Industrial Estate, Bhiwandi Warehousing & Logistics Park',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Tamil Nadu',
    district: 'Chennai',
    lat: 13.0827,
    lng: 80.2707,
    industrialZone: 'Sriperumbudur Auto-EV Hub, Guindy Industrial Corridor, OMR Tech Belt',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    lat: 11.0168,
    lng: 76.9558,
    industrialZone: 'Foundry & Pump Clusters, CODISSIA Industrial Park, Textile Machinery',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Gujarat',
    district: 'Ahmedabad',
    lat: 23.0225,
    lng: 72.5714,
    industrialZone: 'Sanand Industrial Cluster, Changodar Pharma & Logistics Hub',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Gujarat',
    district: 'Vadodara',
    lat: 22.3072,
    lng: 73.1812,
    industrialZone: 'Makarpura GIDC, Halol Auto & Heavy Engineering Belt',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Delhi NCR',
    district: 'Gurugram',
    lat: 28.4595,
    lng: 77.0266,
    industrialZone: 'Cyber City, Manesar Automotive Zone, Udyog Vihar',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Delhi NCR',
    district: 'Gautam Buddha Nagar',
    lat: 28.5355,
    lng: 77.3910,
    industrialZone: 'Noida Phase II Electronics Manufacturing Cluster, Ecotech Greater Noida',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    lat: 17.6868,
    lng: 83.2185,
    industrialZone: 'Atchutapuram SEZ, Jawaharlal Nehru Pharma City, Visakhapatnam Port Belt',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  },
  {
    state: 'Rajasthan',
    district: 'Jaipur',
    lat: 26.9124,
    lng: 75.7873,
    industrialZone: 'Sitapura Industrial Area, Mahindra World City, Solar Equipment Cluster',
    hasDemandData: true,
    hasSupplyData: true,
    hasTrainingData: true
  }
];

export const STATES = Array.from(new Set(LOCATIONS.map(l => l.state)));
