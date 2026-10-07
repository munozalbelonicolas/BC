/**
 * @file customerEntities.js
 * Domain models and status enumerations for the Customer Account Portal.
 */

export const CustomerOrderStatus = {
  PENDING: 'Pendiente de pago',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando pedido',
  READY_PICKUP: 'Listo para retirar',
  SHIPPED: 'Despachado en camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devuelto'
};

export const ReturnReason = {
  DEFECTIVE: 'Producto con falla o defecto de fábrica',
  INCORRECT_ITEM: 'Recibí un producto diferente al comprado',
  NOT_AS_EXPECTED: 'No cumple con las especificaciones esperadas',
  WRONG_SIZE: 'Talle o modelo incorrecto',
  OTHER: 'Otro motivo'
};

export const ReturnStatus = {
  REQUESTED: 'Solicitud enviada',
  IN_REVIEW: 'En revisión técnica',
  APPROVED: 'Aprobada - Esperando recepción',
  REJECTED: 'Rechazada',
  ITEM_RECEIVED: 'Producto recibido en depósito',
  REFUNDED: 'Reembolso realizado'
};

export const NotificationType = {
  ORDER: 'order',
  PROMOTION: 'promotion',
  SYSTEM: 'system',
  RETURN: 'return'
};
