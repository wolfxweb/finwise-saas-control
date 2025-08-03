#!/usr/bin/env python3
"""
Script para testar a atualização de planos via API
"""

import urllib.request
import json

# Dados para atualizar o plano Empresarial
plan_data = {
    'name': 'Empresarial',
    'description': 'Para grandes empresas com necessidades complexas',
    'price': 399.00,
    'billing_cycle': 'monthly',
    'max_users': 50,
    'max_branches': 10,
    'max_invoices': 2000,
    'marketplace_sync_limit': 10000,
    'modules': [
        'cash_flow',
        'accounts_receivable', 
        'accounts_payable',
        'cost_center',
        'products',
        'inventory',
        'suppliers',
        'purchases',
        'shipping',
        'orders',
        'marketplace',
        'invoice',
        'users',
        'support',
        'accounts'  # Adicionando o módulo de contas
    ]
}

# Preparar a requisição
data = json.dumps(plan_data).encode('utf-8')
req = urllib.request.Request(
    'http://localhost:8000/api/v1/admin/plans/1',
    data=data,
    headers={'Content-Type': 'application/json'},
    method='PUT'
)

try:
    # Fazer a requisição
    with urllib.request.urlopen(req) as response:
        result = response.read().decode('utf-8')
        print('Status:', response.status)
        print('Resposta:', result)
except Exception as e:
    print('Erro:', e) 