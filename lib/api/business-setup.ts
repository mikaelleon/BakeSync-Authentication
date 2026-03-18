import { createClient } from "@/lib/supabase-client"

export interface BusinessSetupData {
  businessDetails?: {
    businessName: string
    businessType: string
    address: string
    city: string
    state: string
    zipCode: string
    phone: string
    email: string
    website?: string
    taxId?: string
    description?: string
  }
  inventory?: {
    rawMaterials: Array<{
      name: string
      category: string
      unit: string
      currentStock: number
      minStock: number
    }>
    products: Array<{
      name: string
      category: string
      price: number
      description?: string
    }>
  }
  team?: {
    invitations: Array<{
      email: string
      role: 'baker' | 'cashier'
      message?: string
    }>
  }
}

export interface RoleOnboardingData {
  productionSetup?: {
    workSchedule: string
    productionGoals: string
    preferredUnits: string
    notifications: {
      lowStock: boolean
      productionReminders: boolean
      recipeUpdates: boolean
    }
  }
  recipeManagement?: {
    experience: string
    specialties: string[]
    recipePreferences: {
      metricUnits: boolean
      detailedInstructions: boolean
      photoReferences: boolean
    }
  }
  inventoryAccess?: {
    inventoryAccess: {
      viewInventory: boolean
      updateStock: boolean
      receiveDeliveries: boolean
      manageSuppliers: boolean
    }
    stockAlerts: {
      lowStockThreshold: number
      criticalStockThreshold: number
      emailAlerts: boolean
    }
  }
  posSetup?: {
    posSettings: {
      defaultPaymentMethod: string
      autoCalculateTax: boolean
      requireCustomerInfo: boolean
      printReceipts: boolean
    }
    cashDrawer: {
      startingAmount: number
      denominationBreakdown: Record<string, number>
    }
  }
  productKnowledge?: {
    productKnowledge: {
      categories: string[]
      allergens: string[]
      pricing: string
    }
    customerService: {
      greetingStyle: string
      upselling: boolean
      recommendations: boolean
    }
  }
  salesTraining?: {
    salesExperience: string
    trainingCompleted: {
      posSystem: boolean
      paymentProcessing: boolean
      customerService: boolean
      productKnowledge: boolean
    }
  }
}

export class BusinessSetupAPI {
  private supabase = createClient()

  async saveBusinessSetupData(bakeshopId: string, setupType: 'business_details' | 'inventory_setup' | 'team_setup' | 'system_config', stepNumber: number, stepData: any) {
    try {
      // Validate inputs
      if (!bakeshopId || typeof bakeshopId !== 'string') {
        return {
          success: false,
          error: 'Invalid bakeshop ID provided'
        }
      }

      if (!setupType || !['business_details', 'inventory_setup', 'team_setup', 'system_config'].includes(setupType)) {
        return {
          success: false,
          error: 'Invalid setup type provided'
        }
      }

      if (typeof stepNumber !== 'number' || stepNumber < 1) {
        return {
          success: false,
          error: 'Step number must be a positive integer'
        }
      }

      if (!stepData || typeof stepData !== 'object') {
        return {
          success: false,
          error: 'Step data must be a valid object'
        }
      }

      const { data, error } = await this.supabase.rpc('save_business_setup_data', {
        p_bakeshop_id: bakeshopId,
        p_setup_type: setupType,
        p_step_number: stepNumber,
        p_step_data: stepData
      })

      if (error) throw error

      return {
        success: true,
        data: {
          message: data.message
        }
      }
    } catch (error) {
      console.error('Error saving business setup data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save setup data'
      }
    }
  }

  async getBusinessSetupData(bakeshopId: string) {
    try {
      // Validate bakeshop ID
      if (!bakeshopId || typeof bakeshopId !== 'string') {
        return {
          success: false,
          error: 'Invalid bakeshop ID provided'
        }
      }

      const { data, error } = await this.supabase
        .from('business_setup_data')
        .select('*')
        .eq('bakeshop_id', bakeshopId)
        .order('step_number', { ascending: true })

      if (error) throw error

      // Handle empty data case
      if (!data || data.length === 0) {
        return {
          success: true,
          data: {}
        }
      }

      // Group data by setup type
      const groupedData = data.reduce((acc, item) => {
        if (!acc[item.setup_type]) {
          acc[item.setup_type] = []
        }
        acc[item.setup_type].push({
          stepNumber: item.step_number,
          stepData: item.step_data,
          isCompleted: item.is_completed,
          completedAt: item.completed_at
        })
        return acc
      }, {} as Record<string, any[]>)

      return {
        success: true,
        data: groupedData
      }
    } catch (error) {
      console.error('Error getting business setup data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get setup data'
      }
    }
  }

  async saveRoleOnboardingData(userId: string, bakeshopId: string, role: 'owner' | 'baker' | 'cashier', stepNumber: number, stepData: any) {
    try {
      const { data, error } = await this.supabase.rpc('save_role_onboarding_data', {
        p_user_id: userId,
        p_bakeshop_id: bakeshopId,
        p_role: role,
        p_step_number: stepNumber,
        p_step_data: stepData
      })

      if (error) throw error

      return {
        success: true,
        data: {
          message: data.message
        }
      }
    } catch (error) {
      console.error('Error saving role onboarding data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save onboarding data'
      }
    }
  }

  async getRoleOnboardingData(userId: string, bakeshopId: string, role: 'owner' | 'baker' | 'cashier') {
    try {
      const { data, error } = await this.supabase
        .from('role_onboarding_data')
        .select('*')
        .eq('user_id', userId)
        .eq('bakeshop_id', bakeshopId)
        .eq('role', role)
        .order('step_number', { ascending: true })

      if (error) throw error

      const onboardingData = data.map(item => ({
        stepNumber: item.step_number,
        stepData: item.step_data,
        isCompleted: item.is_completed,
        completedAt: item.completed_at
      }))

      return {
        success: true,
        data: onboardingData
      }
    } catch (error) {
      console.error('Error getting role onboarding data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get onboarding data'
      }
    }
  }

  async updateBakeshopDetails(bakeshopId: string, details: any) {
    try {
      // Validate inputs
      if (!bakeshopId || typeof bakeshopId !== 'string') {
        return {
          success: false,
          error: 'Invalid bakeshop ID provided'
        }
      }

      if (!details || typeof details !== 'object') {
        return {
          success: false,
          error: 'Invalid details object provided'
        }
      }

      // Validate required fields
      if (!details.businessName || typeof details.businessName !== 'string' || details.businessName.trim().length === 0) {
        return {
          success: false,
          error: 'Business name is required'
        }
      }

      // Validate email format if provided
      if (details.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(details.email)) {
          return {
            success: false,
            error: 'Invalid email address format'
          }
        }
      }

      const { data, error } = await this.supabase
        .from('bakeshops')
        .update({
          name: details.businessName.trim(),
          business_type: details.businessType,
          address: details.address,
          city: details.city,
          state: details.state,
          zip_code: details.zipCode,
          phone: details.phone,
          email: details.email,
          website: details.website,
          tax_id: details.taxId,
          description: details.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', bakeshopId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          businessType: data.business_type,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zip_code,
          phone: data.phone,
          email: data.email,
          website: data.website,
          taxId: data.tax_id,
          description: data.description
        }
      }
    } catch (error) {
      console.error('Error updating bakeshop details:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update bakeshop details'
      }
    }
  }

  async generateBusinessSlug(businessName: string) {
    try {
      // Validate input
      if (!businessName || typeof businessName !== 'string' || businessName.trim().length === 0) {
        return {
          success: false,
          error: 'Business name is required to generate slug'
        }
      }

      const { data, error } = await this.supabase.rpc('generate_business_slug', {
        business_name: businessName.trim()
      })

      if (error) throw error

      return {
        success: true,
        data: {
          slug: data
        }
      }
    } catch (error) {
      console.error('Error generating business slug:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate business slug'
      }
    }
  }

  async createInitialInventory(bakeshopId: string, inventoryData: any) {
    try {
      // Validate inputs
      if (!bakeshopId || typeof bakeshopId !== 'string') {
        return {
          success: false,
          error: 'Invalid bakeshop ID provided'
        }
      }

      if (!inventoryData || typeof inventoryData !== 'object') {
        return {
          success: false,
          error: 'Invalid inventory data provided'
        }
      }

      const { rawMaterials, products } = inventoryData

      // Validate and create raw materials
      if (rawMaterials && Array.isArray(rawMaterials) && rawMaterials.length > 0) {
        const materialsToInsert = rawMaterials
          .filter((material: any) => 
            material && 
            material.name && 
            typeof material.name === 'string' &&
            material.name.trim().length > 0
          )
          .map((material: any) => ({
            bakeshop_id: bakeshopId,
            name: material.name.trim(),
            category: material.category || 'uncategorized',
            type: 'raw',
            unit: material.unit || 'unit',
            current_stock: typeof material.currentStock === 'number' ? Math.max(0, material.currentStock) : 0,
            min_stock: typeof material.minStock === 'number' ? Math.max(0, material.minStock) : 0,
            last_updated: new Date().toISOString()
          }))

        const { error: materialsError } = await this.supabase
          .from('inventory')
          .insert(materialsToInsert)

        if (materialsError) throw materialsError
      }

      // Validate and create products
      if (products && Array.isArray(products) && products.length > 0) {
        const productsToInsert = products
          .filter((product: any) => 
            product && 
            product.name && 
            typeof product.name === 'string' &&
            product.name.trim().length > 0 &&
            typeof product.price === 'number' &&
            product.price >= 0
          )
          .map((product: any) => ({
            bakeshop_id: bakeshopId,
            name: product.name.trim(),
            category: product.category || 'uncategorized',
            price: Math.max(0, product.price),
            description: product.description || null,
            in_stock: true
          }))

        const { error: productsError } = await this.supabase
          .from('products')
          .insert(productsToInsert)

        if (productsError) throw productsError
      }

      return {
        success: true,
        data: {
          message: 'Initial inventory created successfully'
        }
      }
    } catch (error) {
      console.error('Error creating initial inventory:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create initial inventory'
      }
    }
  }
}

export const businessSetupAPI = new BusinessSetupAPI()
