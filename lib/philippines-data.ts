// Philippines Regions, Provinces, and Cities data

export interface Region {
  code: string
  name: string
  provinces: Province[]
}

export interface Province {
  code: string
  name: string
  cities: City[]
}

export interface City {
  code: string
  name: string
}

export const PHILIPPINES_REGIONS: Region[] = [
  {
    code: 'NCR',
    name: 'National Capital Region (NCR)',
    provinces: [
      {
        code: 'NCR-MANILA',
        name: 'Metro Manila',
        cities: [
          { code: 'MNL-001', name: 'Manila' },
          { code: 'MNL-002', name: 'Makati' },
          { code: 'MNL-003', name: 'Quezon City' },
          { code: 'MNL-004', name: 'Pasig' },
          { code: 'MNL-005', name: 'Taguig' },
          { code: 'MNL-006', name: 'Mandaluyong' },
          { code: 'MNL-007', name: 'San Juan' },
          { code: 'MNL-008', name: 'Pasay' },
          { code: 'MNL-009', name: 'Parañaque' },
          { code: 'MNL-010', name: 'Las Piñas' },
          { code: 'MNL-011', name: 'Muntinlupa' },
          { code: 'MNL-012', name: 'Marikina' },
          { code: 'MNL-013', name: 'Caloocan' },
          { code: 'MNL-014', name: 'Malabon' },
          { code: 'MNL-015', name: 'Navotas' },
          { code: 'MNL-016', name: 'Valenzuela' }
        ]
      }
    ]
  },
  {
    code: 'REGION-I',
    name: 'Region I - Ilocos Region',
    provinces: [
      {
        code: 'ILN',
        name: 'Ilocos Norte',
        cities: [
          { code: 'ILN-001', name: 'Laoag' },
          { code: 'ILN-002', name: 'Batac' },
          { code: 'ILN-003', name: 'Adams' },
          { code: 'ILN-004', name: 'Bacarra' },
          { code: 'ILN-005', name: 'Badoc' },
          { code: 'ILN-006', name: 'Bangui' },
          { code: 'ILN-007', name: 'Banna' },
          { code: 'ILN-008', name: 'Burgos' },
          { code: 'ILN-009', name: 'Carasi' },
          { code: 'ILN-010', name: 'Currimao' },
          { code: 'ILN-011', name: 'Dingras' },
          { code: 'ILN-012', name: 'Dumalneg' },
          { code: 'ILN-013', name: 'Marcos' },
          { code: 'ILN-014', name: 'Nueva Era' },
          { code: 'ILN-015', name: 'Pagudpud' },
          { code: 'ILN-016', name: 'Paoay' },
          { code: 'ILN-017', name: 'Pasuquin' },
          { code: 'ILN-018', name: 'Piddig' },
          { code: 'ILN-019', name: 'Pinili' },
          { code: 'ILN-020', name: 'San Nicolas' },
          { code: 'ILN-021', name: 'Sarrat' },
          { code: 'ILN-022', name: 'Solsona' },
          { code: 'ILN-023', name: 'Vintar' }
        ]
      },
      {
        code: 'ILS',
        name: 'Ilocos Sur',
        cities: [
          { code: 'ILS-001', name: 'Vigan' },
          { code: 'ILS-002', name: 'Candon' },
          { code: 'ILS-003', name: 'Alilem' },
          { code: 'ILS-004', name: 'Banayoyo' },
          { code: 'ILS-005', name: 'Bantay' },
          { code: 'ILS-006', name: 'Burgos' },
          { code: 'ILS-007', name: 'Cabugao' },
          { code: 'ILS-008', name: 'Caoayan' },
          { code: 'ILS-009', name: 'Cervantes' },
          { code: 'ILS-010', name: 'Galimuyod' },
          { code: 'ILS-011', name: 'Gregorio del Pilar' },
          { code: 'ILS-012', name: 'Lidlidda' },
          { code: 'ILS-013', name: 'Magsingal' },
          { code: 'ILS-014', name: 'Nagbukel' },
          { code: 'ILS-015', name: 'Narvacan' },
          { code: 'ILS-016', name: 'Quirino' },
          { code: 'ILS-017', name: 'Salcedo' },
          { code: 'ILS-018', name: 'San Emilio' },
          { code: 'ILS-019', name: 'San Esteban' },
          { code: 'ILS-020', name: 'San Ildefonso' },
          { code: 'ILS-021', name: 'San Juan' },
          { code: 'ILS-022', name: 'San Vicente' },
          { code: 'ILS-023', name: 'Santa' },
          { code: 'ILS-024', name: 'Santa Catalina' },
          { code: 'ILS-025', name: 'Santa Cruz' },
          { code: 'ILS-026', name: 'Santa Lucia' },
          { code: 'ILS-027', name: 'Santa Maria' },
          { code: 'ILS-028', name: 'Santiago' },
          { code: 'ILS-029', name: 'Santo Domingo' },
          { code: 'ILS-030', name: 'Sigay' },
          { code: 'ILS-031', name: 'Sinait' },
          { code: 'ILS-032', name: 'Sugpon' },
          { code: 'ILS-033', name: 'Suyo' },
          { code: 'ILS-034', name: 'Tagudin' }
        ]
      },
      {
        code: 'LUN',
        name: 'La Union',
        cities: [
          { code: 'LUN-001', name: 'San Fernando' },
          { code: 'LUN-002', name: 'Agoo' },
          { code: 'LUN-003', name: 'Aringay' },
          { code: 'LUN-004', name: 'Bacnotan' },
          { code: 'LUN-005', name: 'Bagulin' },
          { code: 'LUN-006', name: 'Balaoan' },
          { code: 'LUN-007', name: 'Bangar' },
          { code: 'LUN-008', name: 'Bauang' },
          { code: 'LUN-009', name: 'Burgos' },
          { code: 'LUN-010', name: 'Caba' },
          { code: 'LUN-011', name: 'Luna' },
          { code: 'LUN-012', name: 'Naguilian' },
          { code: 'LUN-013', name: 'Pugo' },
          { code: 'LUN-014', name: 'Rosario' },
          { code: 'LUN-015', name: 'San Gabriel' },
          { code: 'LUN-016', name: 'San Juan' },
          { code: 'LUN-017', name: 'Santo Tomas' },
          { code: 'LUN-018', name: 'Santol' },
          { code: 'LUN-019', name: 'Sudipen' },
          { code: 'LUN-020', name: 'Tubao' }
        ]
      },
      {
        code: 'PAN',
        name: 'Pangasinan',
        cities: [
          { code: 'PAN-001', name: 'Dagupan' },
          { code: 'PAN-002', name: 'San Carlos' },
          { code: 'PAN-003', name: 'Urdaneta' },
          { code: 'PAN-004', name: 'Alaminos' },
          { code: 'PAN-005', name: 'Lingayen' },
          { code: 'PAN-006', name: 'Mangaldan' },
          { code: 'PAN-007', name: 'Calasiao' },
          { code: 'PAN-008', name: 'Malasiqui' },
          { code: 'PAN-009', name: 'Bayambang' },
          { code: 'PAN-010', name: 'Binmaley' },
          { code: 'PAN-011', name: 'Manaoag' },
          { code: 'PAN-012', name: 'Mangatarem' },
          { code: 'PAN-013', name: 'Mapandan' },
          { code: 'PAN-014', name: 'Pozorrubio' },
          { code: 'PAN-015', name: 'Rosales' },
          { code: 'PAN-016', name: 'San Fabian' },
          { code: 'PAN-017', name: 'San Jacinto' },
          { code: 'PAN-018', name: 'San Manuel' },
          { code: 'PAN-019', name: 'Santa Barbara' },
          { code: 'PAN-020', name: 'Sison' },
          { code: 'PAN-021', name: 'Sual' },
          { code: 'PAN-022', name: 'Tayug' },
          { code: 'PAN-023', name: 'Villasis' },
          { code: 'PAN-024', name: 'Agno' },
          { code: 'PAN-025', name: 'Aguilar' },
          { code: 'PAN-026', name: 'Alcala' },
          { code: 'PAN-027', name: 'Anda' },
          { code: 'PAN-028', name: 'Asingan' },
          { code: 'PAN-029', name: 'Balungao' },
          { code: 'PAN-030', name: 'Bani' },
          { code: 'PAN-031', name: 'Basista' },
          { code: 'PAN-032', name: 'Bautista' },
          { code: 'PAN-033', name: 'Bolinao' },
          { code: 'PAN-034', name: 'Bugallon' },
          { code: 'PAN-035', name: 'Burgos' },
          { code: 'PAN-036', name: 'Dasol' },
          { code: 'PAN-037', name: 'Infanta' },
          { code: 'PAN-038', name: 'Labrador' },
          { code: 'PAN-039', name: 'Laoac' },
          { code: 'PAN-040', name: 'Mabini' },
          { code: 'PAN-041', name: 'Natividad' },
          { code: 'PAN-042', name: 'San Nicolas' },
          { code: 'PAN-043', name: 'San Quintin' },
          { code: 'PAN-044', name: 'Santa Maria' },
          { code: 'PAN-045', name: 'Santo Tomas' },
          { code: 'PAN-046', name: 'Tayug' },
          { code: 'PAN-047', name: 'Umingan' },
          { code: 'PAN-048', name: 'Urbiztondo' }
        ]
      }
    ]
  },
  {
    code: 'REGION-II',
    name: 'Region II - Cagayan Valley',
    provinces: [
      {
        code: 'BTN',
        name: 'Batanes',
        cities: [
          { code: 'BTN-001', name: 'Basco' },
          { code: 'BTN-002', name: 'Itbayat' },
          { code: 'BTN-003', name: 'Ivana' },
          { code: 'BTN-004', name: 'Mahatao' },
          { code: 'BTN-005', name: 'Sabtang' },
          { code: 'BTN-006', name: 'Uyugan' }
        ]
      },
      {
        code: 'CAG',
        name: 'Cagayan',
        cities: [
          { code: 'CAG-001', name: 'Tuguegarao' },
          { code: 'CAG-002', name: 'Santiago' },
          { code: 'CAG-003', name: 'Abulug' },
          { code: 'CAG-004', name: 'Alcala' },
          { code: 'CAG-005', name: 'Allacapan' },
          { code: 'CAG-006', name: 'Amulung' },
          { code: 'CAG-007', name: 'Aparri' },
          { code: 'CAG-008', name: 'Baggao' },
          { code: 'CAG-009', name: 'Ballesteros' },
          { code: 'CAG-010', name: 'Buguey' },
          { code: 'CAG-011', name: 'Calayan' },
          { code: 'CAG-012', name: 'Camalaniugan' },
          { code: 'CAG-013', name: 'Claveria' },
          { code: 'CAG-014', name: 'Enrile' },
          { code: 'CAG-015', name: 'Gattaran' },
          { code: 'CAG-016', name: 'Gonzaga' },
          { code: 'CAG-017', name: 'Iguig' },
          { code: 'CAG-018', name: 'Lal-lo' },
          { code: 'CAG-019', name: 'Lasam' },
          { code: 'CAG-020', name: 'Pamplona' },
          { code: 'CAG-021', name: 'Peñablanca' },
          { code: 'CAG-022', name: 'Piat' },
          { code: 'CAG-023', name: 'Rizal' },
          { code: 'CAG-024', name: 'Sanchez-Mira' },
          { code: 'CAG-025', name: 'Santa Ana' },
          { code: 'CAG-026', name: 'Santa Praxedes' },
          { code: 'CAG-027', name: 'Santa Teresita' },
          { code: 'CAG-028', name: 'Santo Niño' },
          { code: 'CAG-029', name: 'Solana' }
        ]
      },
      {
        code: 'ISA',
        name: 'Isabela',
        cities: [
          { code: 'ISA-001', name: 'Ilagan' },
          { code: 'ISA-002', name: 'Cauayan' },
          { code: 'ISA-003', name: 'Santiago' },
          { code: 'ISA-004', name: 'Alicia' },
          { code: 'ISA-005', name: 'Angadanan' },
          { code: 'ISA-006', name: 'Aurora' },
          { code: 'ISA-007', name: 'Benito Soliven' },
          { code: 'ISA-008', name: 'Burgos' },
          { code: 'ISA-009', name: 'Cabagan' },
          { code: 'ISA-010', name: 'Cabatuan' },
          { code: 'ISA-011', name: 'Cordon' },
          { code: 'ISA-012', name: 'Delfin Albano' },
          { code: 'ISA-013', name: 'Dinapigue' },
          { code: 'ISA-014', name: 'Divilacan' },
          { code: 'ISA-015', name: 'Echague' },
          { code: 'ISA-016', name: 'Gamu' },
          { code: 'ISA-017', name: 'Jones' },
          { code: 'ISA-018', name: 'Luna' },
          { code: 'ISA-019', name: 'Maconacon' },
          { code: 'ISA-020', name: 'Mallig' },
          { code: 'ISA-021', name: 'Naguilian' },
          { code: 'ISA-022', name: 'Palanan' },
          { code: 'ISA-023', name: 'Quezon' },
          { code: 'ISA-024', name: 'Quirino' },
          { code: 'ISA-025', name: 'Ramon' },
          { code: 'ISA-026', name: 'Reina Mercedes' },
          { code: 'ISA-027', name: 'Roxas' },
          { code: 'ISA-028', name: 'San Agustin' },
          { code: 'ISA-029', name: 'San Guillermo' },
          { code: 'ISA-030', name: 'San Isidro' },
          { code: 'ISA-031', name: 'San Manuel' },
          { code: 'ISA-032', name: 'San Mariano' },
          { code: 'ISA-033', name: 'San Mateo' },
          { code: 'ISA-034', name: 'San Pablo' },
          { code: 'ISA-035', name: 'Santa Maria' },
          { code: 'ISA-036', name: 'Santo Tomas' },
          { code: 'ISA-037', name: 'Tumauini' }
        ]
      },
      {
        code: 'NUV',
        name: 'Nueva Vizcaya',
        cities: [
          { code: 'NUV-001', name: 'Bayombong' },
          { code: 'NUV-002', name: 'Solano' },
          { code: 'NUV-003', name: 'Alfonso Castaneda' },
          { code: 'NUV-004', name: 'Ambaguio' },
          { code: 'NUV-005', name: 'Aritao' },
          { code: 'NUV-006', name: 'Bagabag' },
          { code: 'NUV-007', name: 'Bambang' },
          { code: 'NUV-008', name: 'Dupax del Norte' },
          { code: 'NUV-009', name: 'Dupax del Sur' },
          { code: 'NUV-010', name: 'Kasibu' },
          { code: 'NUV-011', name: 'Kayapa' },
          { code: 'NUV-012', name: 'Quezon' },
          { code: 'NUV-013', name: 'Santa Fe' },
          { code: 'NUV-014', name: 'Villaverde' }
        ]
      },
      {
        code: 'QUI',
        name: 'Quirino',
        cities: [
          { code: 'QUI-001', name: 'Cabarroguis' },
          { code: 'QUI-002', name: 'Aglipay' },
          { code: 'QUI-003', name: 'Maddela' },
          { code: 'QUI-004', name: 'Nagtipunan' },
          { code: 'QUI-005', name: 'Saguday' },
          { code: 'QUI-006', name: 'Diffun' }
        ]
      }
    ]
  },
  {
    code: 'REGION-III',
    name: 'Region III - Central Luzon',
    provinces: [
      {
        code: 'AUR',
        name: 'Aurora',
        cities: [
          { code: 'AUR-001', name: 'Baler' },
          { code: 'AUR-002', name: 'Casiguran' },
          { code: 'AUR-003', name: 'Dilasag' },
          { code: 'AUR-004', name: 'Dinalungan' },
          { code: 'AUR-005', name: 'Dingalan' },
          { code: 'AUR-006', name: 'Dipaculao' },
          { code: 'AUR-007', name: 'Maria Aurora' },
          { code: 'AUR-008', name: 'San Luis' }
        ]
      },
      {
        code: 'BUL',
        name: 'Bulacan',
        cities: [
          { code: 'BUL-001', name: 'Malolos' },
          { code: 'BUL-002', name: 'Meycauayan' },
          { code: 'BUL-003', name: 'San Jose del Monte' },
          { code: 'BUL-004', name: 'Baliuag' },
          { code: 'BUL-005', name: 'Plaridel' },
          { code: 'BUL-006', name: 'Angat' },
          { code: 'BUL-007', name: 'Balagtas' },
          { code: 'BUL-008', name: 'Bocaue' },
          { code: 'BUL-009', name: 'Bulakan' },
          { code: 'BUL-010', name: 'Bustos' },
          { code: 'BUL-011', name: 'Calumpit' },
          { code: 'BUL-012', name: 'Doña Remedios Trinidad' },
          { code: 'BUL-013', name: 'Guiguinto' },
          { code: 'BUL-014', name: 'Hagonoy' },
          { code: 'BUL-015', name: 'Marilao' },
          { code: 'BUL-016', name: 'Norzagaray' },
          { code: 'BUL-017', name: 'Obando' },
          { code: 'BUL-018', name: 'Pandi' },
          { code: 'BUL-019', name: 'Paombong' },
          { code: 'BUL-020', name: 'Pulilan' },
          { code: 'BUL-021', name: 'San Ildefonso' },
          { code: 'BUL-022', name: 'San Miguel' },
          { code: 'BUL-023', name: 'San Rafael' },
          { code: 'BUL-024', name: 'Santa Maria' }
        ]
      },
      {
        code: 'PAM',
        name: 'Pampanga',
        cities: [
          { code: 'PAM-001', name: 'San Fernando' },
          { code: 'PAM-002', name: 'Angeles' },
          { code: 'PAM-003', name: 'Mabalacat' },
          { code: 'PAM-004', name: 'Apalit' },
          { code: 'PAM-005', name: 'Guagua' },
          { code: 'PAM-006', name: 'Arayat' },
          { code: 'PAM-007', name: 'Bacolor' },
          { code: 'PAM-008', name: 'Candaba' },
          { code: 'PAM-009', name: 'Floridablanca' },
          { code: 'PAM-010', name: 'Lubao' },
          { code: 'PAM-011', name: 'Macabebe' },
          { code: 'PAM-012', name: 'Magalang' },
          { code: 'PAM-013', name: 'Masantol' },
          { code: 'PAM-014', name: 'Mexico' },
          { code: 'PAM-015', name: 'Minalin' },
          { code: 'PAM-016', name: 'Porac' },
          { code: 'PAM-017', name: 'San Luis' },
          { code: 'PAM-018', name: 'San Simon' },
          { code: 'PAM-019', name: 'Santa Ana' },
          { code: 'PAM-020', name: 'Santa Rita' },
          { code: 'PAM-021', name: 'Santo Tomas' },
          { code: 'PAM-022', name: 'Sasmuan' }
        ]
      },
      {
        code: 'TAR',
        name: 'Tarlac',
        cities: [
          { code: 'TAR-001', name: 'Tarlac City' },
          { code: 'TAR-002', name: 'Concepcion' },
          { code: 'TAR-003', name: 'Capas' },
          { code: 'TAR-004', name: 'Anao' },
          { code: 'TAR-005', name: 'Bamban' },
          { code: 'TAR-006', name: 'Camiling' },
          { code: 'TAR-007', name: 'Gerona' },
          { code: 'TAR-008', name: 'La Paz' },
          { code: 'TAR-009', name: 'Mayantoc' },
          { code: 'TAR-010', name: 'Moncada' },
          { code: 'TAR-011', name: 'Paniqui' },
          { code: 'TAR-012', name: 'Pura' },
          { code: 'TAR-013', name: 'Ramos' },
          { code: 'TAR-014', name: 'San Clemente' },
          { code: 'TAR-015', name: 'San Jose' },
          { code: 'TAR-016', name: 'San Manuel' },
          { code: 'TAR-017', name: 'Santa Ignacia' },
          { code: 'TAR-018', name: 'Victoria' }
        ]
      },
      {
        code: 'NUE',
        name: 'Nueva Ecija',
        cities: [
          { code: 'NUE-001', name: 'Cabanatuan' },
          { code: 'NUE-002', name: 'Palayan' },
          { code: 'NUE-003', name: 'Gapan' },
          { code: 'NUE-004', name: 'San Jose' },
          { code: 'NUE-005', name: 'Aliaga' },
          { code: 'NUE-006', name: 'Bongabon' },
          { code: 'NUE-007', name: 'Cabiao' },
          { code: 'NUE-008', name: 'Carranglan' },
          { code: 'NUE-009', name: 'Cuyapo' },
          { code: 'NUE-010', name: 'Gabaldon' },
          { code: 'NUE-011', name: 'General Mamerto Natividad' },
          { code: 'NUE-012', name: 'General Tinio' },
          { code: 'NUE-013', name: 'Guimba' },
          { code: 'NUE-014', name: 'Jaen' },
          { code: 'NUE-015', name: 'Laur' },
          { code: 'NUE-016', name: 'Licab' },
          { code: 'NUE-017', name: 'Llanera' },
          { code: 'NUE-018', name: 'Lupao' },
          { code: 'NUE-019', name: 'Muñoz' },
          { code: 'NUE-020', name: 'Nampicuan' },
          { code: 'NUE-021', name: 'Pantabangan' },
          { code: 'NUE-022', name: 'Peñaranda' },
          { code: 'NUE-023', name: 'Quezon' },
          { code: 'NUE-024', name: 'Rizal' },
          { code: 'NUE-025', name: 'San Antonio' },
          { code: 'NUE-026', name: 'San Isidro' },
          { code: 'NUE-027', name: 'San Leonardo' },
          { code: 'NUE-028', name: 'Santa Rosa' },
          { code: 'NUE-029', name: 'Santo Domingo' },
          { code: 'NUE-030', name: 'Science City of Muñoz' },
          { code: 'NUE-031', name: 'Talavera' },
          { code: 'NUE-032', name: 'Talugtug' },
          { code: 'NUE-033', name: 'Zaragoza' }
        ]
      },
      {
        code: 'ZAM',
        name: 'Zambales',
        cities: [
          { code: 'ZAM-001', name: 'Olongapo' },
          { code: 'ZAM-002', name: 'Iba' },
          { code: 'ZAM-003', name: 'Botolan' },
          { code: 'ZAM-004', name: 'Cabangan' },
          { code: 'ZAM-005', name: 'Candelaria' },
          { code: 'ZAM-006', name: 'Castillejos' },
          { code: 'ZAM-007', name: 'Masinloc' },
          { code: 'ZAM-008', name: 'Palauig' },
          { code: 'ZAM-009', name: 'San Antonio' },
          { code: 'ZAM-010', name: 'San Felipe' },
          { code: 'ZAM-011', name: 'San Marcelino' },
          { code: 'ZAM-012', name: 'San Narciso' },
          { code: 'ZAM-013', name: 'Santa Cruz' },
          { code: 'ZAM-014', name: 'Subic' }
        ]
      },
      {
        code: 'BAN',
        name: 'Bataan',
        cities: [
          { code: 'BAN-001', name: 'Balanga' },
          { code: 'BAN-002', name: 'Mariveles' },
          { code: 'BAN-003', name: 'Abucay' },
          { code: 'BAN-004', name: 'Bagac' },
          { code: 'BAN-005', name: 'Dinalupihan' },
          { code: 'BAN-006', name: 'Hermosa' },
          { code: 'BAN-007', name: 'Limay' },
          { code: 'BAN-008', name: 'Morong' },
          { code: 'BAN-009', name: 'Orani' },
          { code: 'BAN-010', name: 'Orion' },
          { code: 'BAN-011', name: 'Pilar' },
          { code: 'BAN-012', name: 'Samal' }
        ]
      }
    ]
  },
  {
    code: 'REGION-IV-A',
    name: 'Region IV-A - CALABARZON',
    provinces: [
      {
        code: 'CAV',
        name: 'Cavite',
        cities: [
          { code: 'CAV-001', name: 'Dasmariñas' },
          { code: 'CAV-002', name: 'Bacoor' },
          { code: 'CAV-003', name: 'Imus' },
          { code: 'CAV-004', name: 'Tagaytay' },
          { code: 'CAV-005', name: 'General Trias' },
          { code: 'CAV-006', name: 'Trece Martires' },
          { code: 'CAV-007', name: 'Alfonso' },
          { code: 'CAV-008', name: 'Amadeo' },
          { code: 'CAV-009', name: 'Carmona' },
          { code: 'CAV-010', name: 'Cavite City' },
          { code: 'CAV-011', name: 'General Emilio Aguinaldo' },
          { code: 'CAV-012', name: 'General Mariano Alvarez' },
          { code: 'CAV-013', name: 'Indang' },
          { code: 'CAV-014', name: 'Kawit' },
          { code: 'CAV-015', name: 'Magallanes' },
          { code: 'CAV-016', name: 'Maragondon' },
          { code: 'CAV-017', name: 'Mendez' },
          { code: 'CAV-018', name: 'Naic' },
          { code: 'CAV-019', name: 'Noveleta' },
          { code: 'CAV-020', name: 'Rosario' },
          { code: 'CAV-021', name: 'Silang' },
          { code: 'CAV-022', name: 'Tanza' },
          { code: 'CAV-023', name: 'Ternate' }
        ]
      },
      {
        code: 'LAG',
        name: 'Laguna',
        cities: [
          { code: 'LAG-001', name: 'Calamba' },
          { code: 'LAG-002', name: 'Santa Rosa' },
          { code: 'LAG-003', name: 'San Pedro' },
          { code: 'LAG-004', name: 'Biñan' },
          { code: 'LAG-005', name: 'Los Baños' },
          { code: 'LAG-006', name: 'San Pablo' },
          { code: 'LAG-007', name: 'Alaminos' },
          { code: 'LAG-008', name: 'Bay' },
          { code: 'LAG-009', name: 'Cabuyao' },
          { code: 'LAG-010', name: 'Calauan' },
          { code: 'LAG-011', name: 'Cavinti' },
          { code: 'LAG-012', name: 'Famy' },
          { code: 'LAG-013', name: 'Kalayaan' },
          { code: 'LAG-014', name: 'Liliw' },
          { code: 'LAG-015', name: 'Luisiana' },
          { code: 'LAG-016', name: 'Lumban' },
          { code: 'LAG-017', name: 'Mabitac' },
          { code: 'LAG-018', name: 'Magdalena' },
          { code: 'LAG-019', name: 'Majayjay' },
          { code: 'LAG-020', name: 'Nagcarlan' },
          { code: 'LAG-021', name: 'Paete' },
          { code: 'LAG-022', name: 'Pagsanjan' },
          { code: 'LAG-023', name: 'Pakil' },
          { code: 'LAG-024', name: 'Pangil' },
          { code: 'LAG-025', name: 'Pila' },
          { code: 'LAG-026', name: 'Rizal' },
          { code: 'LAG-027', name: 'Santa Cruz' },
          { code: 'LAG-028', name: 'Santa Maria' },
          { code: 'LAG-029', name: 'Siniloan' },
          { code: 'LAG-030', name: 'Victoria' }
        ]
      },
      {
        code: 'BAT',
        name: 'Batangas',
        cities: [
          { code: 'BAT-001', name: 'Batangas City' },
          { code: 'BAT-002', name: 'Lipa' },
          { code: 'BAT-003', name: 'Tanauan' },
          { code: 'BAT-004', name: 'Agoncillo' },
          { code: 'BAT-005', name: 'Alitagtag' },
          { code: 'BAT-006', name: 'Balayan' },
          { code: 'BAT-007', name: 'Balete' },
          { code: 'BAT-008', name: 'Bauan' },
          { code: 'BAT-009', name: 'Calaca' },
          { code: 'BAT-010', name: 'Calatagan' },
          { code: 'BAT-011', name: 'Cuenca' },
          { code: 'BAT-012', name: 'Ibaan' },
          { code: 'BAT-013', name: 'Laurel' },
          { code: 'BAT-014', name: 'Lemery' },
          { code: 'BAT-015', name: 'Lian' },
          { code: 'BAT-016', name: 'Lobo' },
          { code: 'BAT-017', name: 'Mabini' },
          { code: 'BAT-018', name: 'Malvar' },
          { code: 'BAT-019', name: 'Mataasnakahoy' },
          { code: 'BAT-020', name: 'Nasugbu' },
          { code: 'BAT-021', name: 'Padre Garcia' },
          { code: 'BAT-022', name: 'Rosario' },
          { code: 'BAT-023', name: 'San Jose' },
          { code: 'BAT-024', name: 'San Juan' },
          { code: 'BAT-025', name: 'San Luis' },
          { code: 'BAT-026', name: 'San Nicolas' },
          { code: 'BAT-027', name: 'San Pascual' },
          { code: 'BAT-028', name: 'Santa Teresita' },
          { code: 'BAT-029', name: 'Santo Tomas' },
          { code: 'BAT-030', name: 'Taal' },
          { code: 'BAT-031', name: 'Talisay' },
          { code: 'BAT-032', name: 'Taysan' },
          { code: 'BAT-033', name: 'Tingloy' },
          { code: 'BAT-034', name: 'Tuy' }
        ]
      },
      {
        code: 'RIZ',
        name: 'Rizal',
        cities: [
          { code: 'RIZ-001', name: 'Antipolo' },
          { code: 'RIZ-002', name: 'Taytay' },
          { code: 'RIZ-003', name: 'Cainta' },
          { code: 'RIZ-004', name: 'Angono' },
          { code: 'RIZ-005', name: 'Baras' },
          { code: 'RIZ-006', name: 'Binangonan' },
          { code: 'RIZ-007', name: 'Cardona' },
          { code: 'RIZ-008', name: 'Jalajala' },
          { code: 'RIZ-009', name: 'Morong' },
          { code: 'RIZ-010', name: 'Pililla' },
          { code: 'RIZ-011', name: 'Rodriguez' },
          { code: 'RIZ-012', name: 'San Mateo' },
          { code: 'RIZ-013', name: 'Tanay' },
          { code: 'RIZ-014', name: 'Teresa' }
        ]
      },
      {
        code: 'QUE',
        name: 'Quezon',
        cities: [
          { code: 'QUE-001', name: 'Lucena' },
          { code: 'QUE-002', name: 'Tayabas' },
          { code: 'QUE-003', name: 'Agdangan' },
          { code: 'QUE-004', name: 'Alabat' },
          { code: 'QUE-005', name: 'Atimonan' },
          { code: 'QUE-006', name: 'Buenavista' },
          { code: 'QUE-007', name: 'Burdeos' },
          { code: 'QUE-008', name: 'Calauag' },
          { code: 'QUE-009', name: 'Candelaria' },
          { code: 'QUE-010', name: 'Catanauan' },
          { code: 'QUE-011', name: 'Dolores' },
          { code: 'QUE-012', name: 'General Luna' },
          { code: 'QUE-013', name: 'General Nakar' },
          { code: 'QUE-014', name: 'Guinayangan' },
          { code: 'QUE-015', name: 'Gumaca' },
          { code: 'QUE-016', name: 'Infanta' },
          { code: 'QUE-017', name: 'Jomalig' },
          { code: 'QUE-018', name: 'Lopez' },
          { code: 'QUE-019', name: 'Lucban' },
          { code: 'QUE-020', name: 'Macalelon' },
          { code: 'QUE-021', name: 'Mauban' },
          { code: 'QUE-022', name: 'Mulanay' },
          { code: 'QUE-023', name: 'Padre Burgos' },
          { code: 'QUE-024', name: 'Pagbilao' },
          { code: 'QUE-025', name: 'Panukulan' },
          { code: 'QUE-026', name: 'Patnanungan' },
          { code: 'QUE-027', name: 'Perez' },
          { code: 'QUE-028', name: 'Pitogo' },
          { code: 'QUE-029', name: 'Plaridel' },
          { code: 'QUE-030', name: 'Polillo' },
          { code: 'QUE-031', name: 'Quezon' },
          { code: 'QUE-032', name: 'Real' },
          { code: 'QUE-033', name: 'Sampaloc' },
          { code: 'QUE-034', name: 'San Andres' },
          { code: 'QUE-035', name: 'San Antonio' },
          { code: 'QUE-036', name: 'San Francisco' },
          { code: 'QUE-037', name: 'San Narciso' },
          { code: 'QUE-038', name: 'Sariaya' },
          { code: 'QUE-039', name: 'Tagkawayan' },
          { code: 'QUE-040', name: 'Tiaong' },
          { code: 'QUE-041', name: 'Unisan' }
        ]
      }
    ]
  },
  {
    code: 'REGION-IV-B',
    name: 'Region IV-B - MIMAROPA',
    provinces: [
      {
        code: 'MAD',
        name: 'Marinduque',
        cities: [
          { code: 'MAD-001', name: 'Boac' },
          { code: 'MAD-002', name: 'Buenavista' },
          { code: 'MAD-003', name: 'Gasan' },
          { code: 'MAD-004', name: 'Mogpog' },
          { code: 'MAD-005', name: 'Santa Cruz' },
          { code: 'MAD-006', name: 'Torrijos' }
        ]
      },
      {
        code: 'OCC',
        name: 'Occidental Mindoro',
        cities: [
          { code: 'OCC-001', name: 'Mamburao' },
          { code: 'OCC-002', name: 'San Jose' },
          { code: 'OCC-003', name: 'Abra de Ilog' },
          { code: 'OCC-004', name: 'Calintaan' },
          { code: 'OCC-005', name: 'Looc' },
          { code: 'OCC-006', name: 'Lubang' },
          { code: 'OCC-007', name: 'Magarang' },
          { code: 'OCC-008', name: 'Paluan' },
          { code: 'OCC-009', name: 'Rizal' },
          { code: 'OCC-010', name: 'Sablayan' },
          { code: 'OCC-011', name: 'Santa Cruz' }
        ]
      },
      {
        code: 'ORI',
        name: 'Oriental Mindoro',
        cities: [
          { code: 'ORI-001', name: 'Calapan' },
          { code: 'ORI-002', name: 'Baco' },
          { code: 'ORI-003', name: 'Bansud' },
          { code: 'ORI-004', name: 'Bongabong' },
          { code: 'ORI-005', name: 'Bulalacao' },
          { code: 'ORI-006', name: 'Gloria' },
          { code: 'ORI-007', name: 'Mansalay' },
          { code: 'ORI-008', name: 'Naujan' },
          { code: 'ORI-009', name: 'Pinamalayan' },
          { code: 'ORI-010', name: 'Pola' },
          { code: 'ORI-011', name: 'Puerto Galera' },
          { code: 'ORI-012', name: 'Roxas' },
          { code: 'ORI-013', name: 'San Teodoro' },
          { code: 'ORI-014', name: 'Socorro' },
          { code: 'ORI-015', name: 'Victoria' }
        ]
      },
      {
        code: 'PLW',
        name: 'Palawan',
        cities: [
          { code: 'PLW-001', name: 'Puerto Princesa' },
          { code: 'PLW-002', name: 'Aborlan' },
          { code: 'PLW-003', name: 'Agutaya' },
          { code: 'PLW-004', name: 'Araceli' },
          { code: 'PLW-005', name: 'Balabac' },
          { code: 'PLW-006', name: 'Bataraza' },
          { code: 'PLW-007', name: 'Brooke\'s Point' },
          { code: 'PLW-008', name: 'Busuanga' },
          { code: 'PLW-009', name: 'Cagayancillo' },
          { code: 'PLW-010', name: 'Coron' },
          { code: 'PLW-011', name: 'Culion' },
          { code: 'PLW-012', name: 'Cuyo' },
          { code: 'PLW-013', name: 'Dumaran' },
          { code: 'PLW-014', name: 'El Nido' },
          { code: 'PLW-015', name: 'Kalayaan' },
          { code: 'PLW-016', name: 'Linapacan' },
          { code: 'PLW-017', name: 'Magsaysay' },
          { code: 'PLW-018', name: 'Narra' },
          { code: 'PLW-019', name: 'Quezon' },
          { code: 'PLW-020', name: 'Rizal' },
          { code: 'PLW-021', name: 'Roxas' },
          { code: 'PLW-022', name: 'San Vicente' },
          { code: 'PLW-023', name: 'Sofronio Española' },
          { code: 'PLW-024', name: 'Taytay' }
        ]
      },
      {
        code: 'ROM',
        name: 'Romblon',
        cities: [
          { code: 'ROM-001', name: 'Romblon' },
          { code: 'ROM-002', name: 'Alcantara' },
          { code: 'ROM-003', name: 'Banton' },
          { code: 'ROM-004', name: 'Cajidiocan' },
          { code: 'ROM-005', name: 'Calatrava' },
          { code: 'ROM-006', name: 'Concepcion' },
          { code: 'ROM-007', name: 'Corcuera' },
          { code: 'ROM-008', name: 'Ferrol' },
          { code: 'ROM-009', name: 'Looc' },
          { code: 'ROM-010', name: 'Magdiwang' },
          { code: 'ROM-011', name: 'Odiongan' },
          { code: 'ROM-012', name: 'San Agustin' },
          { code: 'ROM-013', name: 'San Andres' },
          { code: 'ROM-014', name: 'San Fernando' },
          { code: 'ROM-015', name: 'San Jose' },
          { code: 'ROM-016', name: 'Santa Fe' },
          { code: 'ROM-017', name: 'Santa Maria' }
        ]
      }
    ]
  },
  {
    code: 'REGION-V',
    name: 'Region V - Bicol Region',
    provinces: [
      {
        code: 'ALB',
        name: 'Albay',
        cities: [
          { code: 'ALB-001', name: 'Legazpi' },
          { code: 'ALB-002', name: 'Ligao' },
          { code: 'ALB-003', name: 'Tabaco' },
          { code: 'ALB-004', name: 'Bacacay' },
          { code: 'ALB-005', name: 'Camalig' },
          { code: 'ALB-006', name: 'Daraga' },
          { code: 'ALB-007', name: 'Guinobatan' },
          { code: 'ALB-008', name: 'Jovellar' },
          { code: 'ALB-009', name: 'Libon' },
          { code: 'ALB-010', name: 'Malilipot' },
          { code: 'ALB-011', name: 'Malinao' },
          { code: 'ALB-012', name: 'Manito' },
          { code: 'ALB-013', name: 'Oas' },
          { code: 'ALB-014', name: 'Pio Duran' },
          { code: 'ALB-015', name: 'Polangui' },
          { code: 'ALB-016', name: 'Rapu-Rapu' },
          { code: 'ALB-017', name: 'Santo Domingo' },
          { code: 'ALB-018', name: 'Tiwi' }
        ]
      },
      {
        code: 'CAN',
        name: 'Camarines Norte',
        cities: [
          { code: 'CAN-001', name: 'Daet' },
          { code: 'CAN-002', name: 'Basud' },
          { code: 'CAN-003', name: 'Capalonga' },
          { code: 'CAN-004', name: 'Jose Panganiban' },
          { code: 'CAN-005', name: 'Labo' },
          { code: 'CAN-006', name: 'Mercedes' },
          { code: 'CAN-007', name: 'Paracale' },
          { code: 'CAN-008', name: 'San Lorenzo Ruiz' },
          { code: 'CAN-009', name: 'San Vicente' },
          { code: 'CAN-010', name: 'Santa Elena' },
          { code: 'CAN-011', name: 'Talisay' },
          { code: 'CAN-012', name: 'Vinzons' }
        ]
      },
      {
        code: 'CAS',
        name: 'Camarines Sur',
        cities: [
          { code: 'CAS-001', name: 'Naga' },
          { code: 'CAS-002', name: 'Iriga' },
          { code: 'CAS-003', name: 'Baao' },
          { code: 'CAS-004', name: 'Balatan' },
          { code: 'CAS-005', name: 'Bato' },
          { code: 'CAS-006', name: 'Bombon' },
          { code: 'CAS-007', name: 'Buhi' },
          { code: 'CAS-008', name: 'Bula' },
          { code: 'CAS-009', name: 'Cabusao' },
          { code: 'CAS-010', name: 'Calabanga' },
          { code: 'CAS-011', name: 'Camaligan' },
          { code: 'CAS-012', name: 'Canaman' },
          { code: 'CAS-013', name: 'Caramoan' },
          { code: 'CAS-014', name: 'Del Gallego' },
          { code: 'CAS-015', name: 'Gainza' },
          { code: 'CAS-016', name: 'Garchitorena' },
          { code: 'CAS-017', name: 'Goa' },
          { code: 'CAS-018', name: 'Lagonoy' },
          { code: 'CAS-019', name: 'Libmanan' },
          { code: 'CAS-020', name: 'Lupi' },
          { code: 'CAS-021', name: 'Magarao' },
          { code: 'CAS-022', name: 'Milaor' },
          { code: 'CAS-023', name: 'Minalabac' },
          { code: 'CAS-024', name: 'Nabua' },
          { code: 'CAS-025', name: 'Ocampo' },
          { code: 'CAS-026', name: 'Pamplona' },
          { code: 'CAS-027', name: 'Pasacao' },
          { code: 'CAS-028', name: 'Pili' },
          { code: 'CAS-029', name: 'Presentacion' },
          { code: 'CAS-030', name: 'Ragay' },
          { code: 'CAS-031', name: 'Sagñay' },
          { code: 'CAS-032', name: 'San Fernando' },
          { code: 'CAS-033', name: 'San Jose' },
          { code: 'CAS-034', name: 'Sipocot' },
          { code: 'CAS-035', name: 'Siruma' },
          { code: 'CAS-036', name: 'Tigaon' },
          { code: 'CAS-037', name: 'Tinambac' }
        ]
      },
      {
        code: 'CAT',
        name: 'Catanduanes',
        cities: [
          { code: 'CAT-001', name: 'Virac' },
          { code: 'CAT-002', name: 'Bagamanoc' },
          { code: 'CAT-003', name: 'Baras' },
          { code: 'CAT-004', name: 'Bato' },
          { code: 'CAT-005', name: 'Caramoran' },
          { code: 'CAT-006', name: 'Gigmoto' },
          { code: 'CAT-007', name: 'Pandan' },
          { code: 'CAT-008', name: 'Panganiban' },
          { code: 'CAT-009', name: 'San Andres' },
          { code: 'CAT-010', name: 'San Miguel' },
          { code: 'CAT-011', name: 'Viga' }
        ]
      },
      {
        code: 'MAS',
        name: 'Masbate',
        cities: [
          { code: 'MAS-001', name: 'Masbate City' },
          { code: 'MAS-002', name: 'Aroroy' },
          { code: 'MAS-003', name: 'Baleno' },
          { code: 'MAS-004', name: 'Balud' },
          { code: 'MAS-005', name: 'Batuan' },
          { code: 'MAS-006', name: 'Cataingan' },
          { code: 'MAS-007', name: 'Cawayan' },
          { code: 'MAS-008', name: 'Claveria' },
          { code: 'MAS-009', name: 'Dimasalang' },
          { code: 'MAS-010', name: 'Esperanza' },
          { code: 'MAS-011', name: 'Mandaon' },
          { code: 'MAS-012', name: 'Milagros' },
          { code: 'MAS-013', name: 'Mobo' },
          { code: 'MAS-014', name: 'Monreal' },
          { code: 'MAS-015', name: 'Palanas' },
          { code: 'MAS-016', name: 'Pio V. Corpuz' },
          { code: 'MAS-017', name: 'Placer' },
          { code: 'MAS-018', name: 'San Fernando' },
          { code: 'MAS-019', name: 'San Jacinto' },
          { code: 'MAS-020', name: 'San Pascual' },
          { code: 'MAS-021', name: 'Uson' }
        ]
      },
      {
        code: 'SOR',
        name: 'Sorsogon',
        cities: [
          { code: 'SOR-001', name: 'Sorsogon City' },
          { code: 'SOR-002', name: 'Barcelona' },
          { code: 'SOR-003', name: 'Bulan' },
          { code: 'SOR-004', name: 'Bulusan' },
          { code: 'SOR-005', name: 'Casiguran' },
          { code: 'SOR-006', name: 'Castilla' },
          { code: 'SOR-007', name: 'Donsol' },
          { code: 'SOR-008', name: 'Gubat' },
          { code: 'SOR-009', name: 'Irosin' },
          { code: 'SOR-010', name: 'Juban' },
          { code: 'SOR-011', name: 'Magallanes' },
          { code: 'SOR-012', name: 'Matnog' },
          { code: 'SOR-013', name: 'Pilar' },
          { code: 'SOR-014', name: 'Prieto Diaz' },
          { code: 'SOR-015', name: 'Santa Magdalena' }
        ]
      }
    ]
  },
  {
    code: 'REGION-VI',
    name: 'Region VI - Western Visayas',
    provinces: [
      {
        code: 'AKL',
        name: 'Aklan',
        cities: [
          { code: 'AKL-001', name: 'Kalibo' }
        ]
      },
      {
        code: 'ANT',
        name: 'Antique',
        cities: [
          { code: 'ANT-001', name: 'San Jose de Buenavista' }
        ]
      },
      {
        code: 'CAP',
        name: 'Capiz',
        cities: [
          { code: 'CAP-001', name: 'Roxas' }
        ]
      },
      {
        code: 'GUI',
        name: 'Guimaras',
        cities: [
          { code: 'GUI-001', name: 'Jordan' }
        ]
      },
      {
        code: 'ILI',
        name: 'Iloilo',
        cities: [
          { code: 'ILI-001', name: 'Iloilo City' },
          { code: 'ILI-002', name: 'Passi' }
        ]
      },
      {
        code: 'NEC',
        name: 'Negros Occidental',
        cities: [
          { code: 'NEC-001', name: 'Bacolod' },
          { code: 'NEC-002', name: 'Bago' },
          { code: 'NEC-003', name: 'Cadiz' },
          { code: 'NEC-004', name: 'Escalante' },
          { code: 'NEC-005', name: 'Himamaylan' },
          { code: 'NEC-006', name: 'Kabankalan' },
          { code: 'NEC-007', name: 'La Carlota' },
          { code: 'NEC-008', name: 'Sagay' },
          { code: 'NEC-009', name: 'San Carlos' },
          { code: 'NEC-010', name: 'Silay' },
          { code: 'NEC-011', name: 'Sipalay' },
          { code: 'NEC-012', name: 'Talisay' },
          { code: 'NEC-013', name: 'Victorias' }
        ]
      }
    ]
  },
  {
    code: 'REGION-VII',
    name: 'Region VII - Central Visayas',
    provinces: [
      {
        code: 'CEB',
        name: 'Cebu',
        cities: [
          { code: 'CEB-001', name: 'Cebu City' },
          { code: 'CEB-002', name: 'Lapu-Lapu' },
          { code: 'CEB-003', name: 'Mandaue' },
          { code: 'CEB-004', name: 'Talisay' },
          { code: 'CEB-005', name: 'Toledo' },
          { code: 'CEB-006', name: 'Danao' },
          { code: 'CEB-007', name: 'Bogo' },
          { code: 'CEB-008', name: 'Carcar' },
          { code: 'CEB-009', name: 'Naga' }
        ]
      },
      {
        code: 'BOH',
        name: 'Bohol',
        cities: [
          { code: 'BOH-001', name: 'Tagbilaran' },
          { code: 'BOH-002', name: 'Jagna' }
        ]
      },
      {
        code: 'NER',
        name: 'Negros Oriental',
        cities: [
          { code: 'NER-001', name: 'Dumaguete' },
          { code: 'NER-002', name: 'Bais' },
          { code: 'NER-003', name: 'Bayawan' },
          { code: 'NER-004', name: 'Canlaon' },
          { code: 'NER-005', name: 'Guihulngan' },
          { code: 'NER-006', name: 'Tanjay' }
        ]
      },
      {
        code: 'SIG',
        name: 'Siquijor',
        cities: [
          { code: 'SIG-001', name: 'Siquijor' }
        ]
      }
    ]
  },
  {
    code: 'REGION-VIII',
    name: 'Region VIII - Eastern Visayas',
    provinces: [
      {
        code: 'BIL',
        name: 'Biliran',
        cities: [
          { code: 'BIL-001', name: 'Naval' }
        ]
      },
      {
        code: 'EAS',
        name: 'Eastern Samar',
        cities: [
          { code: 'EAS-001', name: 'Borongan' }
        ]
      },
      {
        code: 'LEY',
        name: 'Leyte',
        cities: [
          { code: 'LEY-001', name: 'Tacloban' },
          { code: 'LEY-002', name: 'Ormoc' },
          { code: 'LEY-003', name: 'Baybay' }
        ]
      },
      {
        code: 'NSA',
        name: 'Northern Samar',
        cities: [
          { code: 'NSA-001', name: 'Catarman' }
        ]
      },
      {
        code: 'SLE',
        name: 'Samar',
        cities: [
          { code: 'SLE-001', name: 'Catbalogan' },
          { code: 'SLE-002', name: 'Calbayog' }
        ]
      },
      {
        code: 'SSA',
        name: 'Southern Leyte',
        cities: [
          { code: 'SSA-001', name: 'Maasin' }
        ]
      },
      {
        code: 'WSA',
        name: 'Western Samar',
        cities: [
          { code: 'WSA-001', name: 'Calbayog' }
        ]
      }
    ]
  },
  {
    code: 'REGION-IX',
    name: 'Region IX - Zamboanga Peninsula',
    provinces: [
      {
        code: 'ZAN',
        name: 'Zamboanga del Norte',
        cities: [
          { code: 'ZAN-001', name: 'Dipolog' },
          { code: 'ZAN-002', name: 'Dapitan' }
        ]
      },
      {
        code: 'ZAS',
        name: 'Zamboanga del Sur',
        cities: [
          { code: 'ZAS-001', name: 'Pagadian' },
          { code: 'ZAS-002', name: 'Zamboanga City' }
        ]
      },
      {
        code: 'ZSI',
        name: 'Zamboanga Sibugay',
        cities: [
          { code: 'ZSI-001', name: 'Ipil' }
        ]
      }
    ]
  },
  {
    code: 'REGION-X',
    name: 'Region X - Northern Mindanao',
    provinces: [
      {
        code: 'BUK',
        name: 'Bukidnon',
        cities: [
          { code: 'BUK-001', name: 'Malaybalay' },
          { code: 'BUK-002', name: 'Valencia' }
        ]
      },
      {
        code: 'CAM',
        name: 'Camiguin',
        cities: [
          { code: 'CAM-001', name: 'Mambajao' }
        ]
      },
      {
        code: 'LAN',
        name: 'Lanao del Norte',
        cities: [
          { code: 'LAN-001', name: 'Iligan' },
          { code: 'LAN-002', name: 'Tubod' }
        ]
      },
      {
        code: 'MIS',
        name: 'Misamis Oriental',
        cities: [
          { code: 'MIS-001', name: 'Cagayan de Oro' },
          { code: 'MIS-002', name: 'Gingoog' },
          { code: 'MIS-003', name: 'El Salvador' }
        ]
      },
      {
        code: 'MSO',
        name: 'Misamis Occidental',
        cities: [
          { code: 'MSO-001', name: 'Oroquieta' },
          { code: 'MSO-002', name: 'Ozamiz' },
          { code: 'MSO-003', name: 'Tangub' }
        ]
      }
    ]
  },
  {
    code: 'REGION-XI',
    name: 'Region XI - Davao Region',
    provinces: [
      {
        code: 'DAV',
        name: 'Davao del Sur',
        cities: [
          { code: 'DAV-001', name: 'Davao City' },
          { code: 'DAV-002', name: 'Digos' }
        ]
      },
      {
        code: 'DAN',
        name: 'Davao del Norte',
        cities: [
          { code: 'DAN-001', name: 'Tagum' },
          { code: 'DAN-002', name: 'Panabo' },
          { code: 'DAN-003', name: 'Island Garden City of Samal' }
        ]
      },
      {
        code: 'DAO',
        name: 'Davao Occidental',
        cities: [
          { code: 'DAO-001', name: 'Mati' }
        ]
      },
      {
        code: 'DAOR',
        name: 'Davao de Oro',
        cities: [
          { code: 'DAOR-001', name: 'Nabunturan' },
          { code: 'DAOR-002', name: 'Monkayo' }
        ]
      },
      {
        code: 'DAORI',
        name: 'Davao Oriental',
        cities: [
          { code: 'DAORI-001', name: 'Mati' }
        ]
      }
    ]
  },
  {
    code: 'REGION-XII',
    name: 'Region XII - SOCCSKSARGEN',
    provinces: [
      {
        code: 'COS',
        name: 'Cotabato',
        cities: [
          { code: 'COS-001', name: 'Kidapawan' }
        ]
      },
      {
        code: 'SAR',
        name: 'Sarangani',
        cities: [
          { code: 'SAR-001', name: 'Alabel' }
        ]
      },
      {
        code: 'SCO',
        name: 'South Cotabato',
        cities: [
          { code: 'SCO-001', name: 'Koronadal' },
          { code: 'SCO-002', name: 'General Santos' }
        ]
      },
      {
        code: 'SUK',
        name: 'Sultan Kudarat',
        cities: [
          { code: 'SUK-001', name: 'Isulan' }
        ]
      }
    ]
  },
  {
    code: 'REGION-XIII',
    name: 'Region XIII - Caraga',
    provinces: [
      {
        code: 'AGN',
        name: 'Agusan del Norte',
        cities: [
          { code: 'AGN-001', name: 'Butuan' },
          { code: 'AGN-002', name: 'Cabadbaran' }
        ]
      },
      {
        code: 'AGS',
        name: 'Agusan del Sur',
        cities: [
          { code: 'AGS-001', name: 'Prosperidad' }
        ]
      },
      {
        code: 'DIN',
        name: 'Dinagat Islands',
        cities: [
          { code: 'DIN-001', name: 'San Jose' }
        ]
      },
      {
        code: 'SUR',
        name: 'Surigao del Norte',
        cities: [
          { code: 'SUR-001', name: 'Surigao City' }
        ]
      },
      {
        code: 'SUS',
        name: 'Surigao del Sur',
        cities: [
          { code: 'SUS-001', name: 'Tandag' },
          { code: 'SUS-002', name: 'Bislig' }
        ]
      }
    ]
  },
  {
    code: 'BARMM',
    name: 'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)',
    provinces: [
      {
        code: 'BAS',
        name: 'Basilan',
        cities: [
          { code: 'BAS-001', name: 'Isabela' },
          { code: 'BAS-002', name: 'Lamitan' }
        ]
      },
      {
        code: 'LDS',
        name: 'Lanao del Sur',
        cities: [
          { code: 'LDS-001', name: 'Marawi' }
        ]
      },
      {
        code: 'MAG',
        name: 'Maguindanao',
        cities: [
          { code: 'MAG-001', name: 'Cotabato City' }
        ]
      },
      {
        code: 'SLU',
        name: 'Sulu',
        cities: [
          { code: 'SLU-001', name: 'Jolo' }
        ]
      },
      {
        code: 'TAW',
        name: 'Tawi-Tawi',
        cities: [
          { code: 'TAW-001', name: 'Bongao' }
        ]
      }
    ]
  },
  {
    code: 'COR',
    name: 'Cordillera Administrative Region (CAR)',
    provinces: [
      {
        code: 'ABR',
        name: 'Abra',
        cities: [
          { code: 'ABR-001', name: 'Bangued' },
          { code: 'ABR-002', name: 'Boliney' },
          { code: 'ABR-003', name: 'Bucay' },
          { code: 'ABR-004', name: 'Bucloc' },
          { code: 'ABR-005', name: 'Daguioman' },
          { code: 'ABR-006', name: 'Danglas' },
          { code: 'ABR-007', name: 'Dolores' },
          { code: 'ABR-008', name: 'La Paz' },
          { code: 'ABR-009', name: 'Lacub' },
          { code: 'ABR-010', name: 'Lagangilang' },
          { code: 'ABR-011', name: 'Lagayan' },
          { code: 'ABR-012', name: 'Langiden' },
          { code: 'ABR-013', name: 'Licuan-Baay' },
          { code: 'ABR-014', name: 'Luba' },
          { code: 'ABR-015', name: 'Malibcong' },
          { code: 'ABR-016', name: 'Manabo' },
          { code: 'ABR-017', name: 'Peñarrubia' },
          { code: 'ABR-018', name: 'Pidigan' },
          { code: 'ABR-019', name: 'Pilar' },
          { code: 'ABR-020', name: 'Sallapadan' },
          { code: 'ABR-021', name: 'San Isidro' },
          { code: 'ABR-022', name: 'San Juan' },
          { code: 'ABR-023', name: 'San Quintin' },
          { code: 'ABR-024', name: 'Tayum' },
          { code: 'ABR-025', name: 'Tineg' },
          { code: 'ABR-026', name: 'Tubo' },
          { code: 'ABR-027', name: 'Villaviciosa' }
        ]
      },
      {
        code: 'APA',
        name: 'Apayao',
        cities: [
          { code: 'APA-001', name: 'Kabugao' },
          { code: 'APA-002', name: 'Calanasan' },
          { code: 'APA-003', name: 'Conner' },
          { code: 'APA-004', name: 'Flora' },
          { code: 'APA-005', name: 'Luna' },
          { code: 'APA-006', name: 'Pudtol' },
          { code: 'APA-007', name: 'Santa Marcela' }
        ]
      },
      {
        code: 'BEN',
        name: 'Benguet',
        cities: [
          { code: 'BEN-001', name: 'Baguio' },
          { code: 'BEN-002', name: 'La Trinidad' },
          { code: 'BEN-003', name: 'Atok' },
          { code: 'BEN-004', name: 'Bakun' },
          { code: 'BEN-005', name: 'Bokod' },
          { code: 'BEN-006', name: 'Buguias' },
          { code: 'BEN-007', name: 'Itogon' },
          { code: 'BEN-008', name: 'Kabayan' },
          { code: 'BEN-009', name: 'Kapangan' },
          { code: 'BEN-010', name: 'Kibungan' },
          { code: 'BEN-011', name: 'Mankayan' },
          { code: 'BEN-012', name: 'Sablan' },
          { code: 'BEN-013', name: 'Tuba' },
          { code: 'BEN-014', name: 'Tublay' }
        ]
      },
      {
        code: 'IFU',
        name: 'Ifugao',
        cities: [
          { code: 'IFU-001', name: 'Lagawe' },
          { code: 'IFU-002', name: 'Aguinaldo' },
          { code: 'IFU-003', name: 'Alfonso Lista' },
          { code: 'IFU-004', name: 'Asipulo' },
          { code: 'IFU-005', name: 'Banaue' },
          { code: 'IFU-006', name: 'Hingyon' },
          { code: 'IFU-007', name: 'Hungduan' },
          { code: 'IFU-008', name: 'Kiangan' },
          { code: 'IFU-009', name: 'Lamut' },
          { code: 'IFU-010', name: 'Mayoyao' },
          { code: 'IFU-011', name: 'Tinoc' }
        ]
      },
      {
        code: 'KAL',
        name: 'Kalinga',
        cities: [
          { code: 'KAL-001', name: 'Tabuk' },
          { code: 'KAL-002', name: 'Balbalan' },
          { code: 'KAL-003', name: 'Lubuagan' },
          { code: 'KAL-004', name: 'Pasil' },
          { code: 'KAL-005', name: 'Pinukpuk' },
          { code: 'KAL-006', name: 'Rizal' },
          { code: 'KAL-007', name: 'Tanudan' },
          { code: 'KAL-008', name: 'Tinglayan' }
        ]
      },
      {
        code: 'MOU',
        name: 'Mountain Province',
        cities: [
          { code: 'MOU-001', name: 'Bontoc' },
          { code: 'MOU-002', name: 'Barlig' },
          { code: 'MOU-003', name: 'Bauko' },
          { code: 'MOU-004', name: 'Besao' },
          { code: 'MOU-005', name: 'Natonin' },
          { code: 'MOU-006', name: 'Paracelis' },
          { code: 'MOU-007', name: 'Sabangan' },
          { code: 'MOU-008', name: 'Sadanga' },
          { code: 'MOU-009', name: 'Sagada' },
          { code: 'MOU-010', name: 'Tadian' }
        ]
      }
    ]
  }
]

export function getRegions(): Region[] {
  return PHILIPPINES_REGIONS
}

export function getProvincesByRegion(regionCode: string): Province[] {
  const region = PHILIPPINES_REGIONS.find(r => r.code === regionCode)
  return region ? region.provinces : []
}

export function getCitiesByProvince(regionCode: string, provinceCode: string): City[] {
  const region = PHILIPPINES_REGIONS.find(r => r.code === regionCode)
  if (!region) return []
  
  const province = region.provinces.find(p => p.code === provinceCode)
  return province ? province.cities : []
}

export function getRegionName(regionCode: string): string {
  const region = PHILIPPINES_REGIONS.find(r => r.code === regionCode)
  return region ? region.name : ''
}

export function getProvinceName(regionCode: string, provinceCode: string): string {
  const region = PHILIPPINES_REGIONS.find(r => r.code === regionCode)
  if (!region) return ''
  
  const province = region.provinces.find(p => p.code === provinceCode)
  return province ? province.name : ''
}

export function getCityName(regionCode: string, provinceCode: string, cityCode: string): string {
  const region = PHILIPPINES_REGIONS.find(r => r.code === regionCode)
  if (!region) return ''
  
  const province = region.provinces.find(p => p.code === provinceCode)
  if (!province) return ''
  
  const city = province.cities.find(c => c.code === cityCode)
  return city ? city.name : ''
}
