package org.vgu.backend.service.bookingrecord;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vgu.backend.enums.TypeAction;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Booking;
import org.vgu.backend.model.BookingRecord;
import org.vgu.backend.repository.BookingRecordRepository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingRecordService implements IBookingRecordService {

    private static final Logger logger = LoggerFactory.getLogger(BookingRecordService.class);
    
    private final BookingRecordRepository bookingRecordRepository;
    private final ObjectMapper objectMapper;

    @Override
    public BookingRecord createRecord(Booking booking, TypeAction action, Account performedBy, String description) {
        try {
            BookingRecord record = BookingRecord.builder()
                    .booking(booking)
                    .action(action)
                    .performedBy(performedBy)
                    .description(description)
                    .build();

            BookingRecord savedRecord = bookingRecordRepository.save(record);
            
            logger.info("Created booking record: {}", savedRecord.getLogFormat());
            
            return savedRecord;
        } catch (Exception e) {
            logger.error("Error creating booking record for booking {}: {}", 
                        booking != null ? booking.getBookingCode() : "null", e.getMessage(), e);
            throw new RuntimeException("Failed to create booking record", e);
        }
    }

    @Override
    public BookingRecord createDetailedRecord(Booking booking, TypeAction action, Account performedBy, 
                                            String description, String previousValues, String currentValues, 
                                            String additionalData) {
        try {
            BookingRecord record = BookingRecord.builder()
                    .booking(booking)
                    .action(action)
                    .performedBy(performedBy)
                    .description(description)
                    .previousValues(previousValues)
                    .currentValues(currentValues)
                    .additionalData(additionalData)
                    .build();

            BookingRecord savedRecord = bookingRecordRepository.save(record);
            
            logger.info("Created detailed booking record: {}", savedRecord.getLogFormat());
            
            return savedRecord;
        } catch (Exception e) {
            logger.error("Error creating detailed booking record for booking {}: {}", 
                        booking != null ? booking.getBookingCode() : "null", e.getMessage(), e);
            throw new RuntimeException("Failed to create detailed booking record", e);
        }
    }

    @Override
    public BookingRecord createSystemRecord(Booking booking, TypeAction action, String description) {
        return createRecord(booking, action, null, description);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingRecord> getRecordsForBooking(Long bookingId) {
        try {
            return bookingRecordRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
        } catch (Exception e) {
            logger.error("Error retrieving records for booking {}: {}", bookingId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve booking records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingRecord> getRecordsForBooking(Long bookingId, Pageable pageable) {
        try {
            return bookingRecordRepository.findByBookingId(bookingId, pageable);
        } catch (Exception e) {
            logger.error("Error retrieving paginated records for booking {}: {}", bookingId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve booking records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingRecord> getRecordsByBookingCode(String bookingCode) {
        try {
            return bookingRecordRepository.findByBookingCode(bookingCode);
        } catch (Exception e) {
            logger.error("Error retrieving records for booking code {}: {}", bookingCode, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve booking records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingRecord> getRecordsByAction(TypeAction action) {
        try {
            return bookingRecordRepository.findByActionOrderByCreatedAtDesc(action);
        } catch (Exception e) {
            logger.error("Error retrieving records for action {}: {}", action, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve booking records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingRecord> getRecordsByPerformer(Long accountId, Pageable pageable) {
        try {
            return bookingRecordRepository.findByPerformedByAccountId(accountId, pageable);
        } catch (Exception e) {
            logger.error("Error retrieving records for performer {}: {}", accountId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve booking records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingRecord> getRecordsByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        try {
            return bookingRecordRepository.findByCreatedAtBetween(startDate, endDate, pageable);
        } catch (Exception e) {
            logger.error("Error retrieving records for date range {} to {}: {}", startDate, endDate, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve booking records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingRecord> getRecentRecords() {
        try {
            LocalDateTime since = LocalDateTime.now().minusHours(24);
            return bookingRecordRepository.findRecentRecords(since);
        } catch (Exception e) {
            logger.error("Error retrieving recent records: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve recent booking records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingRecord> getRecordsByCustomer(Long customerId, Pageable pageable) {
        try {
            return bookingRecordRepository.findByCustomerId(customerId, pageable);
        } catch (Exception e) {
            logger.error("Error retrieving records for customer {}: {}", customerId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve booking records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingRecord> searchRecordsByDescription(String keyword, Pageable pageable) {
        try {
            return bookingRecordRepository.findByDescriptionContaining(keyword, pageable);
        } catch (Exception e) {
            logger.error("Error searching records with keyword {}: {}", keyword, e.getMessage(), e);
            throw new RuntimeException("Failed to search booking records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<TypeAction, Long> getAuditSummary(Long bookingId) {
        try {
            List<Object[]> results = bookingRecordRepository.getAuditSummaryForBooking(bookingId);
            Map<TypeAction, Long> summary = new HashMap<>();
            
            for (Object[] result : results) {
                TypeAction action = (TypeAction) result[0];
                Long count = (Long) result[1];
                summary.put(action, count);
            }
            
            return summary;
        } catch (Exception e) {
            logger.error("Error retrieving audit summary for booking {}: {}", bookingId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve audit summary", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<TypeAction, Long> getActionStatistics() {
        try {
            Map<TypeAction, Long> statistics = new HashMap<>();
            
            // Get counts for all booking-related actions
            TypeAction[] bookingActions = {
                TypeAction.BOOKING_CREATED,
                TypeAction.BOOKING_UPDATED,
                TypeAction.BOOKING_CANCELLED,
                TypeAction.BOOKING_CONFIRMED,
                TypeAction.BOOKING_COMPLETED
            };
            
            for (TypeAction action : bookingActions) {
                Long count = bookingRecordRepository.countByAction(action);
                statistics.put(action, count);
            }
            
            return statistics;
        } catch (Exception e) {
            logger.error("Error retrieving action statistics: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve action statistics", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingRecord> getSystemGeneratedRecords(Pageable pageable) {
        try {
            return bookingRecordRepository.findSystemGeneratedRecords(pageable);
        } catch (Exception e) {
            logger.error("Error retrieving system-generated records: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve system-generated records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingRecord> getUserGeneratedRecords(Pageable pageable) {
        try {
            return bookingRecordRepository.findUserGeneratedRecords(pageable);
        } catch (Exception e) {
            logger.error("Error retrieving user-generated records: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve user-generated records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Long countRecordsForBooking(Long bookingId) {
        try {
            return bookingRecordRepository.countByBookingId(bookingId);
        } catch (Exception e) {
            logger.error("Error counting records for booking {}: {}", bookingId, e.getMessage(), e);
            throw new RuntimeException("Failed to count booking records", e);
        }
    }

    @Override
    public Long deleteOldRecords(LocalDateTime beforeDate) {
        try {
            List<BookingRecord> oldRecords = bookingRecordRepository.findByCreatedAtBetween(
                LocalDateTime.of(2000, 1, 1, 0, 0), beforeDate, Pageable.unpaged()).getContent();
            
            Long count = (long) oldRecords.size();
            bookingRecordRepository.deleteAll(oldRecords);
            
            logger.info("Deleted {} old booking records created before {}", count, beforeDate);
            
            return count;
        } catch (Exception e) {
            logger.error("Error deleting old records before {}: {}", beforeDate, e.getMessage(), e);
            throw new RuntimeException("Failed to delete old records", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String exportRecordsToCsv(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            List<BookingRecord> records = bookingRecordRepository.findByCreatedAtBetween(
                startDate, endDate, Pageable.unpaged()).getContent();
            
            StringBuilder csv = new StringBuilder();
            csv.append("ID,Booking Code,Action,Performed By,Description,Created At,IP Address\n");
            
            for (BookingRecord record : records) {
                csv.append(String.format("%d,%s,%s,%s,\"%s\",%s,%s\n",
                    record.getId(),
                    record.getBookingCode() != null ? record.getBookingCode() : "",
                    record.getAction(),
                    record.getPerformerUsername(),
                    record.getDescription() != null ? record.getDescription().replace("\"", "\"\"") : "",
                    record.getCreatedAt(),
                    record.getIpAddress() != null ? record.getIpAddress() : ""
                ));
            }
            
            return csv.toString();
        } catch (Exception e) {
            logger.error("Error exporting records to CSV: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to export records", e);
        }
    }

    /**
     * Helper method to convert object to JSON string
     */
    public String toJsonString(Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            logger.warn("Failed to convert object to JSON: {}", e.getMessage());
            return object.toString();
        }
    }

    /**
     * Helper method to create record with automatic JSON serialization of previous/current values
     */
    public BookingRecord createRecordWithValues(Booking booking, TypeAction action, Account performedBy, 
                                              String description, Object previousValues, Object currentValues) {
        String prevJson = previousValues != null ? toJsonString(previousValues) : null;
        String currJson = currentValues != null ? toJsonString(currentValues) : null;
        
        return createDetailedRecord(booking, action, performedBy, description, prevJson, currJson, null);
    }
}
