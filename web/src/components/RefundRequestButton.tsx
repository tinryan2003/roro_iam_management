import React, { useState } from 'react';
import { Button, Modal, Form, Input, message, Space } from 'antd';
import { ExclamationCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { BookingResponse } from '../types/booking';

const { TextArea } = Input;

interface RefundRequestButtonProps {
  booking: BookingResponse;
  onRefundRequested: () => void;
}

const RefundRequestButton: React.FC<RefundRequestButtonProps> = ({ 
  booking, 
  onRefundRequested 
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  // Check if refund can be requested based on business rules
  const canRequestRefund = () => {
    // Cannot request refund if already requested
    if (booking.refundRequested) {
      return false;
    }
    
    // Cannot request refund after IN_REVIEW status
    const restrictedStatuses = ['IN_REVIEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'IN_REFUND', 'REFUNDED'];
    return !restrictedStatuses.includes(booking.status);
  };

  const getStatusMessage = () => {
    if (booking.refundRequested) {
      if (booking.refundProcessedAt) {
        return booking.status === 'REFUNDED' 
          ? 'Refund has been approved and processed' 
          : 'Refund request was rejected';
      }
      return 'Refund request is pending review by accountant';
    }
    
    if (!canRequestRefund()) {
      return 'Refund cannot be requested after booking reaches IN_REVIEW status';
    }
    
    return null;
  };

  const handleRequestRefund = async (values: { reason: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/workflow/${booking.id}/request-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          reason: values.reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Refund request submitted successfully');
        setIsModalVisible(false);
        form.resetFields();
        onRefundRequested();
      } else {
        message.error(data.error || 'Failed to submit refund request');
      }
    } catch (error) {
      console.error('Error requesting refund:', error);
      message.error('Failed to submit refund request');
    } finally {
      setIsLoading(false);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Render refund status if already requested or processed
  if (booking.refundRequested) {
    return (
      <Space direction="vertical" size="small">
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: booking.status === 'REFUNDED' ? '#f6ffed' : '#fff7e6',
          border: `1px solid ${booking.status === 'REFUNDED' ? '#52c41a' : '#faad14'}`,
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          <strong>Refund Status:</strong> {getStatusMessage()}
        </div>
        
        {booking.refundReason && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <strong>Reason:</strong> {booking.refundReason}
          </div>
        )}
        
        {booking.refundRequestedAt && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <strong>Requested:</strong> {new Date(booking.refundRequestedAt).toLocaleString()}
          </div>
        )}
        
        {booking.refundReason && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <strong>Refund Notes:</strong> {booking.refundReason}
          </div>
        )}
        
        {booking.refundProcessedAt && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <strong>Processed:</strong> {new Date(booking.refundProcessedAt).toLocaleString()}
          </div>
        )}
      </Space>
    );
  }

  // Show disabled button with message if refund cannot be requested
  if (!canRequestRefund()) {
    return (
      <div>
        <Button 
          disabled 
          icon={<DollarOutlined />}
          style={{ marginBottom: '8px' }}
        >
          Request Refund
        </Button>
        <div style={{ 
          fontSize: '12px', 
          color: '#ff4d4f',
          fontStyle: 'italic'
        }}>
          {getStatusMessage()}
        </div>
      </div>
    );
  }

  // Show active refund request button
  return (
    <>
      <Button 
        type="primary" 
        danger 
        icon={<DollarOutlined />}
        onClick={showModal}
      >
        Request Refund
      </Button>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            Request Refund
          </Space>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fff7e6', 
            border: '1px solid #faad14',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <strong>Important:</strong> Once your booking reaches IN_REVIEW status, 
            refund requests will no longer be available. Please submit your request now 
            if you need to cancel this booking.
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <strong>Booking Details:</strong>
            <br />
            <span style={{ color: '#666' }}>
              Booking Code: {booking.bookingCode}<br />
              Amount: ${booking.totalAmount}<br />
              Status: {booking.status}
            </span>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleRequestRefund}
        >
          <Form.Item
            name="reason"
            label="Reason for Refund Request"
            rules={[
              { required: true, message: 'Please provide a reason for the refund request' },
              { min: 10, message: 'Reason must be at least 10 characters' },
              { max: 1000, message: 'Reason cannot exceed 1000 characters' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Please explain why you need to cancel this booking and request a refund..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                danger 
                htmlType="submit" 
                loading={isLoading}
              >
                Submit Refund Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default RefundRequestButton;
