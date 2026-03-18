// Simple verification service for development
// This provides a reliable fallback when database verification fails

interface VerificationRecord {
  email: string
  code: string
  expiresAt: Date
  verified: boolean
}

class SimpleVerificationService {
  private verifications: Map<string, VerificationRecord> = new Map()

  // Generate a 6-digit code
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Create verification record
  createVerification(email: string, code: string, expiresHours: number = 24): void {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expiresHours)
    
    this.verifications.set(email, {
      email,
      code,
      expiresAt,
      verified: false
    })
    
    console.log(`🔐 SIMPLE VERIFICATION: ${email} -> ${code}`)
  }

  // Verify code
  verifyCode(email: string, code: string): boolean {
    const record = this.verifications.get(email)
    
    if (!record) {
      console.log(`❌ No verification record found for ${email}`)
      return false
    }
    
    if (record.verified) {
      console.log(`❌ Code already verified for ${email}`)
      return false
    }
    
    if (new Date() > record.expiresAt) {
      console.log(`❌ Code expired for ${email}`)
      this.verifications.delete(email)
      return false
    }
    
    if (record.code === code) {
      record.verified = true
      console.log(`✅ Code verified successfully for ${email}`)
      return true
    }
    
    console.log(`❌ Invalid code for ${email}: expected ${record.code}, got ${code}`)
    return false
  }

  // Get current code for email
  getCurrentCode(email: string): string | null {
    const record = this.verifications.get(email)
    if (record && !record.verified && new Date() <= record.expiresAt) {
      return record.code
    }
    return null
  }

  // Clear verification for email
  clearVerification(email: string): void {
    this.verifications.delete(email)
  }

  // Clear all verifications
  clearAll(): void {
    this.verifications.clear()
  }

  // Get verification status for debugging
  getVerificationStatus(email: string): any {
    const record = this.verifications.get(email)
    if (!record) {
      return { exists: false }
    }
    return {
      exists: true,
      code: record.code,
      verified: record.verified,
      expiresAt: record.expiresAt,
      isExpired: new Date() > record.expiresAt
    }
  }
}

export const simpleVerificationService = new SimpleVerificationService()