/**
 * Utilidades para sanitización de inputs y prevención de XSS
 */
export class SanitizerUtil {
  
  /**
   * Remueve caracteres peligrosos que pueden causar XSS
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers como onclick=
      .trim();
  }

  /**
   * Sanitiza inputs de texto largo (descripciones, notas)
   */
  static sanitizeText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover scripts
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remover iframes
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  /**
   * Valida que un email sea válido
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Valida que un nombre sea válido (solo letras, espacios, guiones)
   */
  static isValidName(name: string): boolean {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$/;
    return nameRegex.test(name);
  }

  /**
   * Valida que un número de teléfono sea válido
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone);
  }

  /**
   * Escapa caracteres HTML
   */
  static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Valida que un string no contenga SQL peligroso
   */
  static isSafeSqlInput(input: string): boolean {
    const dangerousPatterns = [
      /(\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b)/gi,
      /(\bEXEC\b|\bEXECUTE\b)/gi,
      /(--|;|\/\*|\*\/)/g,
      /(\bUNION\b|\bSELECT\b.*\bFROM\b)/gi
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Limita la longitud de un string
   */
  static truncate(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  }
}
