// Translations for onboarding and UI

export type Language = 'en' | 'tl'

export interface Translations {
  onboarding: {
    title: string
    subtitle: string
    steps: {
      business: string
      location: string
      hours: string
      preferences: string
      notifications: string
      team: string
      complete: string
    }
    navigation: {
      previous: string
      next: string
      complete: string
    }
    business: {
      title: string
      description: string
      businessName: string
      businessType: string
      businessDescription: string
      businessTypeOptions: {
        bakery: string
        cafe: string
        restaurant: string
        food_truck: string
        other: string
      }
    }
    location: {
      title: string
      country: string
      address: string
      street: string
      region: string
      province: string
      city: string
      zipCode: string
      contact: string
      phone: string
      website: string
      phoneExample: string
      zipExample: string
    }
    hours: {
      title: string
      description: string
      closed: string
      hours24: string
      hours24Label: string
    }
    preferences: {
      title: string
      currency: string
      currencyDefault: string
      language: string
      theme: string
      themeOptions: {
        light: string
        dark: string
        system: string
      }
    }
    notifications: {
      title: string
      description: string
      email: string
      emailDesc: string
      push: string
      pushDesc: string
      lowStock: string
      lowStockDesc: string
      productionReminders: string
      productionRemindersDesc: string
      teamUpdates: string
      teamUpdatesDesc: string
      systemAlerts: string
      systemAlertsDesc: string
    }
    team: {
      title: string
      description: string
    }
    complete: {
      title: string
      description: string
    }
    errors: {
      businessNameRequired: string
      addressRequired: string
      regionRequired: string
      provinceRequired: string
      cityRequired: string
      phoneRequired: string
      phoneFormat: string
      zipFormat: string
    }
    days: {
      monday: string
      tuesday: string
      wednesday: string
      thursday: string
      friday: string
      saturday: string
      sunday: string
    }
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    onboarding: {
      title: "Let's set up your bakery management system in just a few steps.",
      subtitle: "We'll guide you through the setup process",
      steps: {
        business: "Business Details",
        location: "Location & Contact",
        hours: "Operating Hours",
        preferences: "Preferences",
        notifications: "Notifications",
        team: "Team Setup",
        complete: "Complete"
      },
      navigation: {
        previous: "Previous",
        next: "Next",
        complete: "Complete Setup"
      },
      business: {
        title: "Tell us about your business",
        description: "This information will help us customize your experience",
        businessName: "Business Name *",
        businessType: "Business Type *",
        businessDescription: "Business Description",
        businessTypeOptions: {
          bakery: "🍰 Bakery",
          cafe: "☕ Cafe",
          restaurant: "🍽️ Restaurant",
          food_truck: "🚚 Food Truck",
          other: "🏪 Other"
        }
      },
      location: {
        title: "Address",
        country: "Country *",
        address: "Address",
        street: "Street Address *",
        region: "Region *",
        province: "Province *",
        city: "City *",
        zipCode: "ZIP/Postal Code *",
        contact: "Contact Information",
        phone: "Phone Number *",
        website: "Website",
        phoneExample: "Example: +639123456789",
        zipExample: "Example: 1000"
      },
      hours: {
        title: "Set your business operating hours for each day of the week.",
        description: "Set your business operating hours for each day of the week.",
        closed: "Closed",
        hours24: "24 Hours (00:00 - 23:59)",
        hours24Label: "24 Hours Open"
      },
      preferences: {
        title: "Preferences",
        currency: "Currency",
        currencyDefault: "Default currency: Philippine Peso",
        language: "Language",
        theme: "Theme",
        themeOptions: {
          light: "Light",
          dark: "Dark",
          system: "System"
        }
      },
      notifications: {
        title: "Notifications",
        description: "Choose which notifications you'd like to receive.",
        email: "Email Notifications",
        emailDesc: "Receive notifications via email",
        push: "Push Notifications",
        pushDesc: "Receive push notifications in your browser",
        lowStock: "Low Stock Alerts",
        lowStockDesc: "Get notified when inventory is running low",
        productionReminders: "Production Reminders",
        productionRemindersDesc: "Reminders for production schedules",
        teamUpdates: "Team Updates",
        teamUpdatesDesc: "Updates about team member activities",
        systemAlerts: "System Alerts",
        systemAlertsDesc: "Important system notifications"
      },
      team: {
        title: "Team Setup",
        description: "Invite team members to your bakery"
      },
      complete: {
        title: "Complete",
        description: "Setup complete"
      },
      errors: {
        businessNameRequired: "Business name is required",
        addressRequired: "Complete address information is required",
        regionRequired: "Region is required",
        provinceRequired: "Province is required",
        cityRequired: "City is required",
        phoneRequired: "Phone number is required",
        phoneFormat: "Phone number must be in format: +639123456789",
        zipFormat: "ZIP code must be in format: 1000"
      },
      days: {
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sunday: "Sunday"
      }
    }
  },
  tl: {
    onboarding: {
      title: "Itakda natin ang iyong sistema ng pamamahala ng bakery sa ilang hakbang lamang.",
      subtitle: "Gagabayan ka namin sa proseso ng pag-setup",
      steps: {
        business: "Mga Detalye ng Negosyo",
        location: "Lokasyon at Kontak",
        hours: "Oras ng Operasyon",
        preferences: "Mga Kagustuhan",
        notifications: "Mga Abiso",
        team: "Pag-setup ng Koponan",
        complete: "Kumpleto"
      },
      navigation: {
        previous: "Nakaraan",
        next: "Susunod",
        complete: "Kumpletuhin ang Setup"
      },
      business: {
        title: "Sabihin sa amin ang tungkol sa iyong negosyo",
        description: "Ang impormasyong ito ay makakatulong sa amin na i-customize ang iyong karanasan",
        businessName: "Pangalan ng Negosyo *",
        businessType: "Uri ng Negosyo *",
        businessDescription: "Paglalarawan ng Negosyo",
        businessTypeOptions: {
          bakery: "🍰 Panaderya",
          cafe: "☕ Kapehan",
          restaurant: "🍽️ Restawran",
          food_truck: "🚚 Food Truck",
          other: "🏪 Iba pa"
        }
      },
      location: {
        title: "Address",
        country: "Bansa *",
        address: "Address",
        street: "Kalye *",
        region: "Rehiyon *",
        province: "Lalawigan *",
        city: "Lungsod *",
        zipCode: "ZIP/Postal Code *",
        contact: "Impormasyon ng Kontak",
        phone: "Numero ng Telepono *",
        website: "Website",
        phoneExample: "Halimbawa: +639123456789",
        zipExample: "Halimbawa: 1000"
      },
      hours: {
        title: "Itakda ang oras ng operasyon ng iyong negosyo para sa bawat araw ng linggo.",
        description: "Itakda ang oras ng operasyon ng iyong negosyo para sa bawat araw ng linggo.",
        closed: "Sarado",
        hours24: "24 Oras (00:00 - 23:59)",
        hours24Label: "24 Oras na Bukas"
      },
      preferences: {
        title: "Mga Kagustuhan",
        currency: "Salapi",
        currencyDefault: "Default na salapi: Piso ng Pilipinas",
        language: "Wika",
        theme: "Tema",
        themeOptions: {
          light: "Maliwanag",
          dark: "Madilim",
          system: "Sistema"
        }
      },
      notifications: {
        title: "Mga Abiso",
        description: "Pumili kung aling mga abiso ang gusto mong matanggap.",
        email: "Mga Abiso sa Email",
        emailDesc: "Tumanggap ng mga abiso sa pamamagitan ng email",
        push: "Mga Push Notification",
        pushDesc: "Tumanggap ng push notifications sa iyong browser",
        lowStock: "Mga Alert sa Mababang Stock",
        lowStockDesc: "Maging alerto kapag mababa na ang inventory",
        productionReminders: "Mga Paalala sa Produksyon",
        productionRemindersDesc: "Mga paalala para sa mga iskedyul ng produksyon",
        teamUpdates: "Mga Update ng Koponan",
        teamUpdatesDesc: "Mga update tungkol sa mga aktibidad ng miyembro ng koponan",
        systemAlerts: "Mga Alert ng Sistema",
        systemAlertsDesc: "Mahahalagang abiso ng sistema"
      },
      team: {
        title: "Pag-setup ng Koponan",
        description: "Mag-imbita ng mga miyembro ng koponan sa iyong bakery"
      },
      complete: {
        title: "Kumpleto",
        description: "Kumpleto na ang setup"
      },
      errors: {
        businessNameRequired: "Kailangan ang pangalan ng negosyo",
        addressRequired: "Kailangan ang kumpletong impormasyon ng address",
        regionRequired: "Kailangan ang rehiyon",
        provinceRequired: "Kailangan ang lalawigan",
        cityRequired: "Kailangan ang lungsod",
        phoneRequired: "Kailangan ang numero ng telepono",
        phoneFormat: "Ang numero ng telepono ay dapat nasa format: +639123456789",
        zipFormat: "Ang ZIP code ay dapat nasa format: 1000"
      },
      days: {
        monday: "Lunes",
        tuesday: "Martes",
        wednesday: "Miyerkules",
        thursday: "Huwebes",
        friday: "Biyernes",
        saturday: "Sabado",
        sunday: "Linggo"
      }
    }
  }
}

export function getTranslations(language: Language = 'en'): Translations {
  return translations[language] || translations.en
}

