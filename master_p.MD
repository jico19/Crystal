    Act as a Principal Software Engineer and Product Architect.                                                                                             
                                                                                                                                                            
    Generate an exhaustive, production-ready ("Final / Build-Ready") Feature Specification for:                                                             
    **Feature:** [e.g. Caregiver Multi-Step Application & Onboarding Funnel]                                                                                
                                                                                                                                                            
    Reference Architecture: @docs/architecture.md                                                                                                           
    Reference Context: @docs/context.md                                                                                                                     
                                                                                                                                                            
    This specification must be so detailed that an autonomous coding agent or junior engineer can implement it without making assumptions. Include the      
  following 8 sections:                                                                                                                                     
                                                                                                                                                            
    1. **Executive Summary & Scope:** User stories, target states (GA/IN), and out-of-scope boundaries.                                                     
    2. **PostgreSQL Database Schema (DDL):**                                                                                                                
       - Exact SQL table definitions, constraints, primary/foreign keys, and indexes.                                                                       
       - Exact Supabase Row-Level Security (RLS) policies for each role (`caregiver`, `coordinator`, `admin`).                                              
    3. **TypeScript & Validation Schemas:**                                                                                                                 
       - Complete Zod schemas for client/server validation with specific error messages.                                                                    
       - Complete TypeScript interfaces & types.                                                                                                            
    4. **Server Actions / API Endpoint Specifications:**                                                                                                    
       - Function/route signatures, request payloads, response types, error handling, and authorization guards.                                             
    5. **UI/UX & Component Architecture:**                                                                                                                  
       - Component tree breakdown (Atomic / shadcn/ui components).                                                                                          
       - Complete state machine: `idle`, `submitting`, `auto_saving`, `error`, `success`, `resuming_draft`.                                                 
       - Field-by-field layout and behavior (masking, auto-complete, validation triggers).                                                                  
    6. **Background Automation & Agent Triggers:**                                                                                                          
       - Webhook/trigger definitions (e.g., linking to Agent-DocOCR or notification dispatchers).                                                           
    7. **Edge Cases & Failure Recovery Matrix:**                                                                                                            
       - Table of potential failure points (network drop, expired session, partial uploads) and recovery strategies.                                        
    8. **Acceptance Test Suite (Given/When/Then):**                                                                                                         
       - At least 6 concrete Gherkin-style test scenarios covering happy paths, security boundaries, and edge cases.    