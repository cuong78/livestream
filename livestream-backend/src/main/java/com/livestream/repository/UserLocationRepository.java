package com.livestream.repository;

import com.livestream.entity.User;
import com.livestream.entity.UserLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserLocationRepository extends JpaRepository<UserLocation, Long> {
    
    /**
     * Find the most recent location for a user
     */
    Optional<UserLocation> findFirstByUserOrderByCreatedAtDesc(User user);
    
    /**
     * Find all locations for a user
     */
    List<UserLocation> findByUserOrderByCreatedAtDesc(User user);
    
    /**
     * Find locations within a time range
     */
    List<UserLocation> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * Find locations by city
     */
    List<UserLocation> findByCity(String city);
    
    /**
     * Count unique users by city
     */
    @Query("SELECT ul.city, COUNT(DISTINCT ul.user) FROM UserLocation ul GROUP BY ul.city")
    List<Object[]> countUsersByCity();
    
    /**
     * Get all unique locations (latest per user)
     */
    @Query("SELECT ul FROM UserLocation ul WHERE ul.createdAt IN " +
           "(SELECT MAX(ul2.createdAt) FROM UserLocation ul2 GROUP BY ul2.user)")
    List<UserLocation> findLatestLocationPerUser();
}
