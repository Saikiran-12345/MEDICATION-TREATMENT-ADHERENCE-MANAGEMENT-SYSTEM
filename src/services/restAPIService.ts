/**
 * REST API Service Layer
 * Provides HTTP endpoints abstraction and API management
 */

import { storageService } from './storageService';
import type { Patient, Treatment, Medication, DoseRecord, Notification } from '../types';

interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  authentication: 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY';
  rateLimit?: number;
  cacheable: boolean;
  responseSchema?: Record<string, any>;
}

interface APIRequest {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  userId?: string;
  ipAddress?: string;
  requestBody?: any;
  statusCode: number;
  responseTime: number; // in ms
  cached: boolean;
  error?: string;
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  secret?: string;
  owner: string;
  scopes: string[];
  rateLimit: number;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
}

class RESTAPIService {
  private endpoints: APIEndpoint[] = [];
  private requestLog: APIRequest[] = [];
  private apiKeys: APIKey[] = [];
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeEndpoints();
  }

  /**
   * Initialize standard REST endpoints
   */
  private initializeEndpoints(): void {
    this.endpoints = [
      // Patient endpoints
      {
        id: 'ep_001',
        path: '/api/patients',
        method: 'GET',
        description: 'Get all patients',
        authentication: 'BEARER',
        rateLimit: 100,
        cacheable: true,
        responseSchema: { type: 'array', items: { type: 'object' } },
      },
      {
        id: 'ep_002',
        path: '/api/patients/:id',
        method: 'GET',
        description: 'Get patient by ID',
        authentication: 'BEARER',
        rateLimit: 200,
        cacheable: true,
      },
      {
        id: 'ep_003',
        path: '/api/patients',
        method: 'POST',
        description: 'Create patient',
        authentication: 'BEARER',
        rateLimit: 50,
        cacheable: false,
      },
      {
        id: 'ep_004',
        path: '/api/patients/:id',
        method: 'PUT',
        description: 'Update patient',
        authentication: 'BEARER',
        rateLimit: 50,
        cacheable: false,
      },
      {
        id: 'ep_005',
        path: '/api/patients/:id',
        method: 'DELETE',
        description: 'Delete patient',
        authentication: 'BEARER',
        rateLimit: 50,
        cacheable: false,
      },

      // Treatment endpoints
      {
        id: 'ep_010',
        path: '/api/treatments',
        method: 'GET',
        description: 'Get all treatments',
        authentication: 'BEARER',
        rateLimit: 100,
        cacheable: true,
      },
      {
        id: 'ep_011',
        path: '/api/treatments/:id',
        method: 'GET',
        description: 'Get treatment by ID',
        authentication: 'BEARER',
        rateLimit: 200,
        cacheable: true,
      },
      {
        id: 'ep_012',
        path: '/api/patients/:patientId/treatments',
        method: 'GET',
        description: 'Get treatments for patient',
        authentication: 'BEARER',
        rateLimit: 100,
        cacheable: true,
      },

      // Medication endpoints
      {
        id: 'ep_020',
        path: '/api/medications',
        method: 'GET',
        description: 'Get all medications',
        authentication: 'BEARER',
        rateLimit: 100,
        cacheable: true,
      },
      {
        id: 'ep_021',
        path: '/api/medications/:id',
        method: 'GET',
        description: 'Get medication by ID',
        authentication: 'BEARER',
        rateLimit: 200,
        cacheable: true,
      },

      // Dose endpoints
      {
        id: 'ep_030',
        path: '/api/doses',
        method: 'GET',
        description: 'Get all doses',
        authentication: 'BEARER',
        rateLimit: 100,
        cacheable: true,
      },
      {
        id: 'ep_031',
        path: '/api/doses/:id',
        method: 'PUT',
        description: 'Update dose status',
        authentication: 'BEARER',
        rateLimit: 200,
        cacheable: false,
      },
      {
        id: 'ep_032',
        path: '/api/patients/:patientId/doses',
        method: 'GET',
        description: 'Get doses for patient',
        authentication: 'BEARER',
        rateLimit: 100,
        cacheable: true,
      },

      // Analytics endpoints
      {
        id: 'ep_040',
        path: '/api/analytics/adherence',
        method: 'GET',
        description: 'Get adherence analytics',
        authentication: 'BEARER',
        rateLimit: 50,
        cacheable: true,
      },
      {
        id: 'ep_041',
        path: '/api/analytics/dashboard',
        method: 'GET',
        description: 'Get dashboard metrics',
        authentication: 'BEARER',
        rateLimit: 100,
        cacheable: true,
      },

      // Notification endpoints
      {
        id: 'ep_050',
        path: '/api/notifications',
        method: 'GET',
        description: 'Get user notifications',
        authentication: 'BEARER',
        rateLimit: 100,
        cacheable: false,
      },
      {
        id: 'ep_051',
        path: '/api/notifications/:id',
        method: 'PUT',
        description: 'Mark notification as read',
        authentication: 'BEARER',
        rateLimit: 200,
        cacheable: false,
      },
    ];
  }

  /**
   * Handle API request
   */
  async handleRequest(
    method: string,
    path: string,
    userId: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<APIResponse<any>> {
    const requestId = this.generateId();
    const startTime = Date.now();

    try {
      // Validate authentication
      if (headers?.authorization) {
        const token = headers.authorization.replace('Bearer ', '');
        if (!this.validateToken(token)) {
          return this.error('UNAUTHORIZED', 'Invalid or expired token', requestId);
        }
      }

      // Check rate limiting
      if (!this.checkRateLimit(userId)) {
        return this.error('RATE_LIMITED', 'Too many requests', requestId);
      }

      // Find endpoint
      const endpoint = this.findEndpoint(method, path);
      if (!endpoint) {
        return this.error('NOT_FOUND', `Endpoint ${method} ${path} not found`, requestId);
      }

      // Check cache
      const cacheKey = `${method}:${path}`;
      if (endpoint.cacheable && method === 'GET') {
        const cached = this.getCache(cacheKey);
        if (cached) {
          this.logRequest(requestId, method, path, userId, body, 200, Date.now() - startTime, true);
          return this.success(cached, requestId);
        }
      }

      // Simulate API call based on method
      const response = await this.simulateAPICall(method, path, body, userId);

      // Cache if applicable
      if (endpoint.cacheable && method === 'GET') {
        this.setCache(cacheKey, response);
      }

      const responseTime = Date.now() - startTime;
      this.logRequest(requestId, method, path, userId, body, 200, responseTime, false);

      return this.success(response, requestId);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logRequest(requestId, method, path, userId, body, 500, responseTime, false, String(error));

      return this.error('INTERNAL_ERROR', String(error), requestId);
    }
  }

  /**
   * Generate API key
   */
  generateAPIKey(name: string, owner: string, scopes: string[] = ['read', 'write'], expiryDays = 365): APIKey {
    const apiKey: APIKey = {
      id: this.generateId(),
      name,
      key: `sk_${this.generateId()}`,
      secret: this.generateSecret(),
      owner,
      scopes,
      rateLimit: 1000,
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString(),
    };

    this.apiKeys.push(apiKey);
    return apiKey;
  }

  /**
   * Revoke API key
   */
  revokeAPIKey(keyId: string): boolean {
    const key = this.apiKeys.find((k) => k.id === keyId);
    if (!key) {
      return false;
    }

    key.isActive = false;
    return true;
  }

  /**
   * Get API usage statistics
   */
  getUsageStats(userId?: string, timeframeHours = 24): {
    totalRequests: number;
    successRequests: number;
    errorRequests: number;
    averageResponseTime: number;
    byEndpoint: Record<string, number>;
    byMethod: Record<string, number>;
  } {
    const cutoffTime = Date.now() - timeframeHours * 60 * 60 * 1000;
    const recentRequests = this.requestLog.filter((r) => new Date(r.timestamp).getTime() > cutoffTime && (!userId || r.userId === userId));

    const byEndpoint: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    let totalResponseTime = 0;

    recentRequests.forEach((r) => {
      const endpoint = `${r.method} ${r.path}`;
      byEndpoint[endpoint] = (byEndpoint[endpoint] || 0) + 1;
      byMethod[r.method] = (byMethod[r.method] || 0) + 1;
      totalResponseTime += r.responseTime;
    });

    const successRequests = recentRequests.filter((r) => r.statusCode < 400).length;
    const errorRequests = recentRequests.filter((r) => r.statusCode >= 400).length;

    return {
      totalRequests: recentRequests.length,
      successRequests,
      errorRequests,
      averageResponseTime: recentRequests.length > 0 ? Math.round(totalResponseTime / recentRequests.length) : 0,
      byEndpoint,
      byMethod,
    };
  }

  /**
   * Get request log
   */
  getRequestLog(limit = 100): APIRequest[] {
    return this.requestLog.slice(-limit);
  }

  /**
   * Get all endpoints
   */
  getEndpoints(): APIEndpoint[] {
    return this.endpoints;
  }

  /**
   * Get endpoint by ID
   */
  getEndpointById(endpointId: string): APIEndpoint | null {
    return this.endpoints.find((e) => e.id === endpointId) || null;
  }

  /**
   * Add custom endpoint
   */
  addCustomEndpoint(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    description: string,
    authentication: 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY' = 'BEARER',
    cacheable = false
  ): APIEndpoint {
    const endpoint: APIEndpoint = {
      id: this.generateId(),
      path,
      method,
      description,
      authentication,
      cacheable,
    };

    this.endpoints.push(endpoint);
    return endpoint;
  }

  /**
   * Private: Find endpoint
   */
  private findEndpoint(method: string, path: string): APIEndpoint | null {
    return this.endpoints.find((e) => e.method === method && this.pathMatches(e.path, path)) || null;
  }

  /**
   * Private: Path matching (simple implementation)
   */
  private pathMatches(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        continue; // Parameter
      }

      if (patternParts[i] !== pathParts[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Private: Simulate API call
   */
  private async simulateAPICall(method: string, path: string, body: any, userId: string): Promise<any> {
    // Simulate API call based on endpoint
    if (path.includes('patients')) {
      if (method === 'GET') {
        return { id: '1', name: 'John Doe', age: 45 };
      }
      if (method === 'POST') {
        return { id: this.generateId(), ...body, created: new Date().toISOString() };
      }
    }

    if (path.includes('treatments')) {
      return { id: '1', name: 'Hypertension Treatment', status: 'ACTIVE' };
    }

    if (path.includes('analytics')) {
      return { adherenceRate: 85, trend: 'IMPROVING' };
    }

    return { success: true };
  }

  /**
   * Private: Validate token
   */
  private validateToken(token: string): boolean {
    // Simple token validation
    return token.startsWith('eyJ') || token.length > 20;
  }

  /**
   * Private: Check rate limit
   */
  private checkRateLimit(userId: string): boolean {
    // Simple rate limiting
    return Math.random() > 0.05; // 95% pass rate
  }

  /**
   * Private: Get cache
   */
  private getCache(key: string): any {
    const cached = this.requestCache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Private: Set cache
   */
  private setCache(key: string, data: any): void {
    this.requestCache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Private: Log request
   */
  private logRequest(requestId: string, method: string, path: string, userId: string | undefined, body: any, statusCode: number, responseTime: number, cached: boolean, error?: string): void {
    this.requestLog.push({
      id: requestId,
      timestamp: new Date().toISOString(),
      method,
      path,
      userId,
      statusCode,
      responseTime,
      cached,
      requestBody: body,
      error,
    });

    // Keep only last 10000 requests
    if (this.requestLog.length > 10000) {
      this.requestLog = this.requestLog.slice(-10000);
    }
  }

  /**
   * Private: Success response
   */
  private success(data: any, requestId: string): APIResponse<any> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        requestId,
      },
    };
  }

  /**
   * Private: Error response
   */
  private error(code: string, message: string, requestId: string, details?: Record<string, any>): APIResponse<any> {
    return {
      success: false,
      error: { code, message, details },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        requestId,
      },
    };
  }

  /**
   * Private: Generate ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Generate secret
   */
  private generateSecret(): string {
    return `sec_${Math.random().toString(36).substr(2, 32)}`;
  }
}

export const restAPIService = new RESTAPIService();
