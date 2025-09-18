import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Space, 
  message, 
  Tag, 
  Card,
  Typography,
  Descriptions
} from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  DollarOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { BookingResponse } from '../types/booking';

const { TextArea } = Input;
const { Title } = Typography;

interface RefundDecision {
  approved: boolean;
  notes: string;
}

const AccountantRefundManagement: React.FC = () => {
  const [refundRequests, setRefundRequests] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  const fetchRefundRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings/workflow/refund-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setRefundRequests(data.content || []);
      } else {
        message.error(data.error || 'Failed to fetch refund requests');
      }
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      message.error('Failed to fetch refund requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (booking: BookingResponse, decision: RefundDecision) => {
    setProcessingRefund(true);
    try {
      const response = await fetch(`/api/booking-workflow/${booking.id}/process-refund`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(decision),
      });

      const data = await response.json();

      if (response.ok) {
        message.success(
          decision.approved 
            ? 'Refund approved successfully - booking process terminated' 
            : 'Refund request rejected - booking process continues'
        );
        setModalVisible(false);
        form.resetFields();
        fetchRefundRequests(); // Refresh the list
        
        // If refund was approved and there was a pending approval cancelled, show additional info
        if (decision.approved && data.approvalCancelled) {
          message.info('Pending approval has been automatically cancelled due to refund approval');
        }
        
        // If backend signals refresh is required, we can add additional refresh logic here
        if (data.refreshRequired) {
          // Could emit an event to refresh other components if needed
          window.dispatchEvent(new CustomEvent('refundProcessed', { 
            detail: { bookingId: booking.id, approved: decision.approved } 
          }));
        }
      } else {
        message.error(data.error || 'Failed to process refund decision');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      message.error('Failed to process refund decision');
    } finally {
      setProcessingRefund(false);
    }
  };

  const showProcessModal = (booking: BookingResponse) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setSelectedBooking(null);
    form.resetFields();
  };

  const onApprove = (values: { notes: string }) => {
    if (selectedBooking) {
      handleProcessRefund(selectedBooking, {
        approved: true,
        notes: values.notes,
      });
    }
  };

  const onReject = (values: { notes: string }) => {
    if (selectedBooking) {
      handleProcessRefund(selectedBooking, {
        approved: false,
        notes: values.notes,
      });
    }
  };

  const columns = [
    {
      title: 'Booking Code',
      dataIndex: 'bookingCode',
      key: 'bookingCode',
      render: (code: string) => <strong>{code}</strong>,
    },
    {
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (customerId: number) => `Customer #${customerId}`,
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'REFUNDED' ? 'green' : 'blue'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Refund Reason',
      dataIndex: 'refundReason',
      key: 'refundReason',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Requested At',
      dataIndex: 'refundRequestedAt',
      key: 'refundRequestedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Requested By',
      dataIndex: 'refundRequestedBy',
      key: 'refundRequestedBy',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: BookingResponse) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            onClick={() => showProcessModal(record)}
            icon={<DollarOutlined />}
          >
            Process
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={3}>
            <DollarOutlined style={{ marginRight: '8px' }} />
            Refund Request Management
          </Title>
          <p>Review and process customer refund requests. Approved refunds will terminate the booking process.</p>
        </div>

        <Table
          columns={columns}
          dataSource={refundRequests}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} refund requests`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            Process Refund Request
          </Space>
        }
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={800}
      >
        {selectedBooking && (
          <div>
            <Card style={{ marginBottom: '16px' }}>
              <Descriptions title="Booking Details" column={2}>
                <Descriptions.Item label="Booking Code">
                  {selectedBooking.bookingCode}
                </Descriptions.Item>
                <Descriptions.Item label="Amount">
                  ${selectedBooking.totalAmount.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="blue">{selectedBooking.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Customer">
                  Customer #{selectedBooking.customerId}
                </Descriptions.Item>
                <Descriptions.Item label="Requested At">
                  {selectedBooking.refundRequestedAt ? 
                    new Date(selectedBooking.refundRequestedAt).toLocaleString() : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Requested By">
                  {selectedBooking.customerName || 'Customer'}
                </Descriptions.Item>
              </Descriptions>
              
              <div style={{ marginTop: '16px' }}>
                <strong>Refund Reason:</strong>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '12px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '6px' 
                }}>
                  {selectedBooking.refundReason}
                </div>
              </div>
            </Card>

            <div style={{ 
              padding: '12px', 
              backgroundColor: '#fff7e6', 
              border: '1px solid #faad14',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <strong>Important:</strong> If you approve this refund, the entire booking process 
              will be terminated and the booking status will change to REFUNDED. If you reject 
              this refund request, the booking process will continue with its current status.
            </div>

            <Form
              form={form}
              layout="vertical"
            >
              <Form.Item
                name="notes"
                label="Decision Notes"
                rules={[
                  { required: true, message: 'Please provide notes for your decision' },
                  { min: 5, message: 'Notes must be at least 5 characters' },
                  { max: 1000, message: 'Notes cannot exceed 1000 characters' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Explain your decision to approve or reject this refund request..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={handleModalCancel}>
                    Cancel
                  </Button>
                  <Button 
                    danger
                    icon={<CloseOutlined />}
                    loading={processingRefund}
                    onClick={() => form.validateFields().then(onReject)}
                  >
                    Reject Refund
                  </Button>
                  <Button 
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={processingRefund}
                    onClick={() => form.validateFields().then(onApprove)}
                  >
                    Approve Refund
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AccountantRefundManagement;
