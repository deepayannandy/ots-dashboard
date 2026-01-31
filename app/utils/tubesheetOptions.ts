export const tubeSheetTypeItems = [
  { label: 'Heat Exchanger', value: 'HEAT_EXCHANGER' },
  { label: 'Boiler', value: 'BOILER' },
  { label: 'EOEG Reactor', value: 'EOEG_REACTOR' },
  { label: 'Glycol', value: 'GLYCOL_REACTOR' },
  { label: 'Acrylic Reactor', value: 'ACRYLIC_REACTOR' },
  { label: 'Gas Cooler', value: 'GAS_COOLER' }
]

export const typeOfPhases = [
  {
    label: 'Initial Tube Sheet Inspection Top And Bottom. Front And Back',
    value: 'INITIAL_TUBE_SHEET_INSPECTION'
  },
  {
    label: 'High Pressure Cleaning- Water And Nozzle Entry Detection',
    value: 'HIGH_PRESSURE_CLEANING'
  },
  {
    label: 'Eddy Current Or RFT Probe Detection',
    value: 'EDDY_CURRENT_OR_RFT_PROBE_DETECTION'
  },
  { label: 'Boroscope Inspection', value: 'BOROSCOPE_INSPECTION' },
  { label: 'Unloading of The Catalyst', value: 'UNLOADING_OF_CATALYST' },
  {
    label: 'Foam Swab Cleaning And Detection',
    value: 'FOAM_SWAB_CLEANING_AND_DETECTION'
  },
  {
    label: 'Mechanical Cleaner Detection',
    value: 'MECHANICAL_CLEANER_DETECTION'
  },
  { label: 'Sand Blasting- Sand', value: 'SAND_BLASTING_SAND' },
  {
    label: 'Sand Blasting- Nozzle',
    value: 'SAND_BLASTING_NOZZLE_DETECTION'
  },
  { label: 'Color Cap', value: 'COLOR_CAP_TRACKING' },
  { label: 'Fish Tape', value: 'FISH_TAPE_TRACKING' },
  { label: 'Air Lancing Tip', value: 'AIR_LANCING_TIP_TRACKING' },
  { label: 'Spring Removal', value: 'SPRING_REMOVAL_TRACKING' },
  { label: 'Spring Insertion', value: 'SPRING_INSERTION_TRACKING' },
  { label: 'Catalyst Outage', value: 'CATALYST_OUTAGE_TRACKING' }
]

export const phaseColorPalette = [
  { label: 'Red', value: 'Red', swatch: '#EF4444' },
  { label: 'Orange', value: 'Orange', swatch: '#F97316' },
  { label: 'Yellow', value: 'Yellow', swatch: '#FACC15' },
  { label: 'Green', value: 'Green', swatch: '#22C55E' },
  { label: 'Cyan', value: 'Cyan', swatch: '#06B6D4' },
  { label: 'Blue', value: 'Blue', swatch: '#3B82F6' },
  { label: 'Indigo', value: 'Indigo', swatch: '#4F46E5' },
  { label: 'Purple', value: 'Purple', swatch: '#7C3AED' },
  { label: 'Pink', value: 'Pink', swatch: '#EC4899' },
  { label: 'Brown', value: 'Brown', swatch: '#92400E' },
  { label: 'Black', value: 'Black', swatch: '#111827' },
  { label: 'White', value: 'White', swatch: '#F9FAFB' }
]

export const tubeSheetStatusLabels = {
  TUBE_SHEET_CREATED: 'Tube Sheet Created',
  CAMERA_CONFIGURED: 'Camera Configured',
  REACTOR_CREATED: 'Layout Created',
  CAMERA_CALIBRATED: 'Camera Calibrated',
  UNDER_SURVEY: 'Under Survey'
}
