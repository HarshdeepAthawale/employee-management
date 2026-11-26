package in.masti.entity;

/**
 * Type of leave request.
 *
 * Each type carries the default number of days granted per year.
 * A default of 0 means the leave type is unlimited (UNPAID).
 */
public enum LeaveType {
    SICK(10),
    CASUAL(12),
    EARNED(15),
    UNPAID(0);

    private final int defaultDays;

    LeaveType(int defaultDays) {
        this.defaultDays = defaultDays;
    }

    public int getDefaultDays() {
        return defaultDays;
    }

    public boolean isUnlimited() {
        return defaultDays == 0;
    }
}
