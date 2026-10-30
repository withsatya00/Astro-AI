"""
SQLAlchemy ORM models for AstroAI Consultation Platform.
Supports Astrologer Profiles, Consultations, Personas, Users,
Birth Charts, Sessions, Knowledge Base Documents, and Reports.
"""
from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from packages.database.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), default="client")  # client, astrologer, admin
    wallet_balance = Column(Float, default=0.0)
    loyalty_points = Column(Integer, default=0)
    referral_code = Column(String(12), index=True, nullable=True)
    referred_by = Column(String(36), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    charts = relationship("BirthChart", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    consultations = relationship("Consultation", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("AstrologerReview", back_populates="user")

class BirthChart(Base):
    __tablename__ = "birth_charts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    owner_key = Column(String(80), nullable=True, index=True)  # "u:<user id>" or "g:<client id>"; see packages/core/identity.py
    name = Column(String(255), nullable=False)
    date_of_birth = Column(String(10), nullable=False)  # YYYY-MM-DD
    time_of_birth = Column(String(8), nullable=True)   # HH:MM:SS or HH:MM
    is_time_approximate = Column(Boolean, default=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timezone_offset = Column(Float, nullable=False)    # e.g., 5.5 for IST
    city = Column(String(255), nullable=True)
    country = Column(String(255), nullable=True)
    system = Column(String(50), default="Vedic")       # Vedic, Western
    ayanamsa = Column(String(50), default="Lahiri")
    chart_data = Column(JSON, nullable=False)          # Full structured planetary & house calculations
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="charts")
    sessions = relationship("ChatSession", back_populates="chart")
    reports = relationship("Report", back_populates="chart")
    consultations = relationship("Consultation", back_populates="chart")

class Astrologer(Base):
    __tablename__ = "astrologers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(120), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    name_hi = Column(String(255), nullable=True)
    title = Column(String(255), nullable=False)
    title_hi = Column(String(255), nullable=True)
    avatar = Column(String(500), nullable=False, default="🕉️")
    bio = Column(Text, nullable=True)
    bio_hi = Column(Text, nullable=True)
    experience_years = Column(Integer, default=10)
    rating = Column(Float, default=4.95)
    review_count = Column(Integer, default=0)
    consultations_count = Column(Integer, default=0)
    price_per_minute = Column(Float, default=25.0)
    currency = Column(String(10), default="INR")
    is_ai = Column(Boolean, default=False)             # True = AI Persona, False = Human Astrologer
    ai_persona_id = Column(String(100), nullable=True) # e.g., acharya_shastri, dr_sunita, pandit_maharaj
    availability = Column(String(50), default="online")# online, busy, offline
    languages = Column(JSON, default=list)             # ["Hindi", "English", "Sanskrit", ...]
    specialties = Column(JSON, default=list)           # ["Vedic Kundli", "Love & Marriage", ...]
    is_featured = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    reviews = relationship("AstrologerReview", back_populates="astrologer", cascade="all, delete-orphan", order_by="desc(AstrologerReview.created_at)")
    consultations = relationship("Consultation", back_populates="astrologer")

class AstrologerReview(Base):
    __tablename__ = "astrologer_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    astrologer_id = Column(String(36), ForeignKey("astrologers.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    user_name = Column(String(255), default="Seeker")
    rating = Column(Float, default=5.0)
    comment = Column(Text, nullable=False)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    astrologer = relationship("Astrologer", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    owner_key = Column(String(80), nullable=True, index=True)  # "u:<user id>" or "g:<client id>"; see packages/core/identity.py
    astrologer_id = Column(String(36), ForeignKey("astrologers.id"), nullable=False, index=True)
    astrologer_type = Column(String(20), default="ai")  # "ai" or "human"
    status = Column(String(50), default="active")       # active, completed, cancelled
    mode = Column(String(50), default="chat")           # chat, call
    title = Column(String(255), default="Astrology Consultation")
    language = Column(String(20), default="en")         # en, hi, sa, mr, gu, bn, ta, te
    chart_id = Column(String(36), ForeignKey("birth_charts.id"), nullable=True, index=True)
    price_per_minute = Column(Float, default=0.0)
    duration_seconds = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    consultation_metadata = Column(JSON, nullable=True) # concern, notes, custom tags
    started_at = Column(DateTime(timezone=True), default=utc_now)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="consultations")
    astrologer = relationship("Astrologer", back_populates="consultations")
    chart = relationship("BirthChart", back_populates="consultations")
    messages = relationship("ChatMessage", back_populates="consultation", cascade="all, delete-orphan", order_by="ChatMessage.created_at")
    feedback = relationship("ConsultationFeedback", back_populates="consultation", uselist=False, cascade="all, delete-orphan")
    summary = relationship("ConsultationSummary", back_populates="consultation", uselist=False, cascade="all, delete-orphan")

class ConsultationFeedback(Base):
    __tablename__ = "consultation_feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    consultation_id = Column(String(36), ForeignKey("consultations.id"), nullable=False, unique=True, index=True)
    rating = Column(Integer, default=5)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    consultation = relationship("Consultation", back_populates="feedback")

class ConsultationSummary(Base):
    __tablename__ = "consultation_summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    consultation_id = Column(String(36), ForeignKey("consultations.id"), nullable=False, unique=True, index=True)
    concern = Column(String(255), nullable=True)
    key_insights = Column(JSON, nullable=True)          # ["Dasha is favorable for career", ...]
    chart_summary = Column(JSON, nullable=True)         # Placements discussed
    remedies = Column(JSON, nullable=True)              # Suggested Vedic remedies
    follow_ups = Column(JSON, nullable=True)            # Recommended next actions
    created_at = Column(DateTime(timezone=True), default=utc_now)

    consultation = relationship("Consultation", back_populates="summary")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    owner_key = Column(String(80), nullable=True, index=True)  # "u:<user id>" or "g:<client id>"; see packages/core/identity.py
    chart_id = Column(String(36), ForeignKey("birth_charts.id"), nullable=True, index=True)
    astrologer_id = Column(String(36), ForeignKey("astrologers.id"), nullable=True, index=True)
    consultation_id = Column(String(36), ForeignKey("consultations.id"), nullable=True, index=True)
    status = Column(String(50), default="active")
    title = Column(String(255), default="Astrology Consultation")
    language = Column(String(20), default="en")        # en, hi, hinglish
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="sessions")
    chart = relationship("BirthChart", back_populates="sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("chat_sessions.id"), nullable=True, index=True)
    consultation_id = Column(String(36), ForeignKey("consultations.id"), nullable=True, index=True)
    role = Column(String(20), nullable=False)          # user, assistant, system, tool
    content = Column(Text, nullable=False)
    msg_metadata = Column(JSON, nullable=True)         # citations, tool execution traces, calculation references
    created_at = Column(DateTime(timezone=True), default=utc_now)

    session = relationship("ChatSession", back_populates="messages")
    consultation = relationship("Consultation", back_populates="messages")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=True)
    publisher = Column(String(255), nullable=True)
    source_url = Column(String(1024), nullable=True)
    license = Column(String(255), default="Public Domain / CC")
    permission_status = Column(String(50), default="PERMITTED")  # PERMITTED, RESTRICTED, REVIEW_REQUIRED
    file_path = Column(String(1024), nullable=False)
    file_type = Column(String(50), nullable=False)     # pdf, txt, md, docx
    file_size_bytes = Column(Integer, nullable=False)
    checksum = Column(String(64), nullable=False, index=True) # SHA256
    status = Column(String(50), default="PENDING")     # PENDING, PROCESSING, INDEXED, FAILED
    error_details = Column(Text, nullable=True)
    chunk_count = Column(Integer, default=0)
    doc_metadata = Column(JSON, nullable=True)         # Structured provenance, chapter, topic, language
    created_at = Column(DateTime(timezone=True), default=utc_now)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    section_title = Column(String(255), nullable=True)
    embedding = Column(JSON, nullable=True)            # List of floats (embedding vector)
    chunk_metadata = Column(JSON, nullable=True)       # Topic, language, verse_id, shloka, hierarchy
    created_at = Column(DateTime(timezone=True), default=utc_now)

    document = relationship("Document", back_populates="chunks")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    chart_id = Column(String(36), ForeignKey("birth_charts.id"), nullable=False, index=True)
    report_type = Column(String(50), default="comprehensive_kundali") # comprehensive_kundali, career, relationship
    title = Column(String(255), nullable=False)
    pdf_path = Column(String(1024), nullable=False)
    status = Column(String(50), default="COMPLETED")   # GENERATING, COMPLETED, FAILED
    report_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="reports")
    chart = relationship("BirthChart", back_populates="reports")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(50), default="credit")  # credit, debit, refund
    description = Column(String(255), nullable=False)
    reference_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    owner_key = Column(String(80), nullable=True, index=True)  # "u:<user id>" or "g:<client id>"
    astrologer_id = Column(String(36), ForeignKey("astrologers.id"), nullable=False, index=True)
    user_name = Column(String(255), nullable=False)
    user_phone = Column(String(50), nullable=True)
    scheduled_at = Column(String(50), nullable=False)
    duration_minutes = Column(Integer, default=15)
    mode = Column(String(50), default="chat")  # chat, call, video
    status = Column(String(50), default="confirmed")  # confirmed, completed, cancelled
    total_amount = Column(Float, default=0.0)
    concern = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    is_priority = Column(Boolean, default=False)       # booked by a Premium member
    member_discount = Column(Float, default=0.0)       # rupees saved through Premium membership
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Temple(Base):
    __tablename__ = "temples"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    deity = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    history_significance = Column(Text, nullable=True)
    image_url = Column(String(1024), nullable=True)
    banner_url = Column(String(1024), nullable=True)
    live_status = Column(String(100), default="Aarti & Darshan Active")
    live_url = Column(String(500), nullable=True)       # embeddable live-darshan URL (e.g. YouTube), set by admin
    aarti_timings = Column(Text, nullable=True)         # JSON list of {"name": ..., "time": ...}, set by admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    offerings = relationship("TempleOffering", back_populates="temple", cascade="all, delete-orphan")

class TempleOffering(Base):
    __tablename__ = "temple_offerings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    temple_id = Column(String(36), ForeignKey("temples.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="chadawa")  # chadawa, sankalp_pooja, aarti, abhishek, item (single chadhava item), puja_tier
    price = Column(Float, nullable=False)
    title_en = Column(String(255), nullable=True)
    description_en = Column(Text, nullable=True)
    emoji = Column(String(8), nullable=True)            # shown on item cards
    popular = Column(Boolean, default=False)            # most-offered items at this temple are listed first
    sort_order = Column(Integer, default=0)
    max_members = Column(Integer, default=1)            # puja tiers: how many devotees one booking covers
    has_prasad_delivery = Column(Boolean, default=True)
    delivery_fee = Column(Float, default=99.0)
    includes_video_proof = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    temple = relationship("Temple", back_populates="offerings")
    bookings = relationship("ChadawaBooking", back_populates="offering")

class ChadawaBooking(Base):
    __tablename__ = "chadawa_bookings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    owner_key = Column(String(80), nullable=True, index=True)
    offering_id = Column(String(36), ForeignKey("temple_offerings.id"), nullable=False, index=True)
    booking_number = Column(String(50), unique=True, index=True, nullable=False)
    devotee_name = Column(String(255), nullable=False)
    devotee_phone = Column(String(50), nullable=True)
    gotra = Column(String(100), default="Kashyap")
    rashi = Column(String(100), nullable=True)
    nakshatra = Column(String(100), nullable=True)
    sankalp_purpose = Column(String(255), nullable=True)
    family_members = Column(Text, nullable=True)  # extra names/gotras included in the same sankalp
    priest_id = Column(String(36), nullable=True)
    coupon_code = Column(String(30), nullable=True)
    discount_amount = Column(Float, default=0.0)
    points_used = Column(Integer, default=0)
    package_ref = Column(String(40), nullable=True, index=True)
    certificate_code = Column(String(24), nullable=True, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    include_prasad = Column(Boolean, default=False)
    delivery_address = Column(Text, nullable=True)
    amount_paid = Column(Float, nullable=False)
    payment_method = Column(String(30), default="WALLET")
    payment_ref = Column(String(100), nullable=True)
    status = Column(String(50), default="PAID")  # PAID, SANKALP_SCHEDULED, VIDEO_UPLOADED, COMPLETED, CANCELLED
    scheduled_for = Column(String(40), nullable=True)
    video_proof_url = Column(String(1024), nullable=True)
    video_recorded_at = Column(DateTime(timezone=True), nullable=True)
    prasad_tracking_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    offering = relationship("TempleOffering", back_populates="bookings")

class MarketplaceProduct(Base):
    __tablename__ = "marketplace_products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    seller_id = Column(String(36), nullable=True, index=True)
    option_groups = Column(Text, nullable=True)         # JSON: [{"key","label","values":[{"value","label","price_delta"}]}]
    extra_images = Column(Text, nullable=True)          # JSON list of additional photo URLs
    listing_status = Column(String(12), default="APPROVED")   # PENDING, APPROVED, REJECTED (is_active can pause an approved item)
    certificate_status = Column(String(20), default="NONE")   # NONE, PENDING, VERIFIED, REJECTED
    certificate_code = Column(String(24), nullable=True, index=True)
    certificate_file = Column(String(500), nullable=True)
    certificate_lab = Column(String(120), nullable=True)
    certificate_number = Column(String(80), nullable=True)
    return_days = Column(Integer, default=7)
    seller_name = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(50), index=True)  # rudraksha, mala, yantra, gemstone, samagri
    description = Column(Text, nullable=False)
    material = Column(String(100), nullable=True)
    origin = Column(String(100), nullable=True)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    stock = Column(Integer, default=50)
    rating = Column(Float, default=4.9)
    review_count = Column(Integer, default=48)
    image_url = Column(String(1024), nullable=True)
    is_energized = Column(Boolean, default=True)
    energized_details = Column(String(255), default="Vedic Mantron Dwara Siddha")
    has_lab_certificate = Column(Boolean, default=True)
    certificate_url = Column(String(1024), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    orders = relationship("MarketplaceOrder", back_populates="product")

class MarketplaceOrder(Base):
    __tablename__ = "marketplace_orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    owner_key = Column(String(80), nullable=True, index=True)
    product_id = Column(String(36), ForeignKey("marketplace_products.id"), nullable=False, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    buyer_name = Column(String(255), nullable=False)
    buyer_phone = Column(String(50), nullable=False)
    buyer_gotra = Column(String(100), nullable=True)
    shipping_address = Column(Text, nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=True)
    group_ref = Column(String(40), nullable=True, index=True)  # orders placed together from one cart share this
    options = Column(Text, nullable=True)               # JSON of the options the buyer chose (ratti, metal, ...)
    discount_amount = Column(Float, default=0.0)
    points_used = Column(Integer, default=0)
    coupon_code = Column(String(30), nullable=True)
    seller_id = Column(String(36), nullable=True, index=True)
    commission_amount = Column(Float, default=0.0)
    seller_amount = Column(Float, default=0.0)
    payout_id = Column(String(36), nullable=True)
    total_price = Column(Float, nullable=False)
    payment_method = Column(String(30), default="COD")
    payment_ref = Column(String(100), nullable=True)
    order_status = Column(String(50), default="PLACED")  # PLACED, PAID, ENERGIZING, DISPATCHED, DELIVERED, CANCELLED
    energization_status = Column(String(50), default="UNDER_PROCESS")  # UNDER_PROCESS, ENERGIZED
    tracking_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    product = relationship("MarketplaceProduct", back_populates="orders")


class MarketplaceReview(Base):
    __tablename__ = "marketplace_reviews"
    __table_args__ = (UniqueConstraint("product_id", "owner_key", name="uq_review_product_owner"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("marketplace_products.id"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("marketplace_orders.id"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    owner_key = Column(String(80), nullable=False, index=True)
    reviewer_name = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    owner_key = Column(String(80), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    body = Column(String(500), nullable=True)
    kind = Column(String(40), nullable=True)   # template key in packages/core/notify.py
    params = Column(Text, nullable=True)       # JSON values for that template
    link = Column(String(200), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class SavedCartItem(Base):
    __tablename__ = "saved_cart_items"
    __table_args__ = (UniqueConstraint("user_id", "product_id", "options_key", name="uq_cart_user_product_options"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("marketplace_products.id"), nullable=False)
    options_key = Column(String(200), default="")
    options = Column(Text, nullable=True)
    quantity = Column(Integer, default=1)


class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("marketplace_products.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Priest(Base):
    __tablename__ = "priests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    temple_id = Column(String(36), ForeignKey("temples.id"), nullable=True, index=True)
    photo_url = Column(String(500), nullable=True)
    years_experience = Column(Integer, default=0)
    languages = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    bio_en = Column(Text, nullable=True)
    verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class SevaPackage(Base):
    """A bundle of repeated sevas (e.g. four Mondays) sold at a discount; each session becomes a scheduled booking."""
    __tablename__ = "seva_packages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(80), unique=True, index=True, nullable=False)
    offering_id = Column(String(36), ForeignKey("temple_offerings.id"), nullable=False)
    title = Column(String(255), nullable=False)
    title_en = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    sessions = Column(Integer, nullable=False)
    cadence = Column(String(30), nullable=False)        # daily, weekly, monthly
    weekday = Column(Integer, nullable=True)            # 0=Monday ... 6=Sunday for weekly packages
    discount_percent = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    offering = relationship("TempleOffering")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    person_name = Column(String(150), nullable=False)
    kind = Column(String(20), default="birthday")       # birthday, anniversary
    month = Column(Integer, nullable=False)
    day = Column(Integer, nullable=False)
    last_notified_year = Column(Integer, nullable=True)


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(30), unique=True, index=True, nullable=False)
    kind = Column(String(10), default="percent")        # percent or flat
    value = Column(Float, nullable=False)
    min_amount = Column(Float, default=0.0)
    max_discount = Column(Float, nullable=True)
    applies_to = Column(String(10), default="all")      # all, mall, seva
    first_order_only = Column(Boolean, default=False)
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_to = Column(DateTime(timezone=True), nullable=True)
    usage_limit = Column(Integer, nullable=True)
    per_user_limit = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    description = Column(String(255), nullable=True)


class CouponUse(Base):
    __tablename__ = "coupon_uses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    coupon_id = Column(String(36), ForeignKey("coupons.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    ref = Column(String(60), nullable=True)
    amount = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class LoyaltyEntry(Base):
    __tablename__ = "loyalty_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    points = Column(Integer, nullable=False)            # positive = earned, negative = redeemed
    reason = Column(String(40), nullable=False)         # order, seva, referral, redeem, refund
    ref = Column(String(60), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    plan = Column(String(20), nullable=False)           # monthly, yearly
    amount_paid = Column(Float, default=0.0)
    started_at = Column(DateTime(timezone=True), default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=False)


class StatusEvent(Base):
    """Timeline entries for orders and bookings (shown as tracking)."""
    __tablename__ = "status_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    kind = Column(String(10), nullable=False)           # order or booking
    ref_id = Column(String(36), nullable=False, index=True)
    status = Column(String(40), nullable=False)
    note = Column(String(300), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class SellerProfile(Base):
    __tablename__ = "seller_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    business_name = Column(String(200), nullable=False)
    phone = Column(String(30), nullable=True)
    upi_id = Column(String(120), nullable=True)
    pan_number = Column(String(20), nullable=True)
    kyc_doc_url = Column(String(500), nullable=True)    # stored in a private folder, visible to admins only
    kyc_status = Column(String(20), default="PENDING")  # PENDING, APPROVED, REJECTED
    kyc_note = Column(String(300), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    seller_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    upi_id = Column(String(120), nullable=True)
    status = Column(String(20), default="REQUESTED")    # REQUESTED, PAID, REJECTED
    reference = Column(String(120), nullable=True)
    requested_at = Column(DateTime(timezone=True), default=utc_now)
    paid_at = Column(DateTime(timezone=True), nullable=True)


class RemedyTask(Base):
    """A remedy (mantra, fast, donation, gemstone, puja...) a user is following, with a daily/weekly check-in streak."""
    __tablename__ = "remedy_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    kind = Column(String(20), default="mantra")        # mantra, fast, donation, gemstone, puja, other
    detail = Column(Text, nullable=True)
    frequency = Column(String(10), default="daily")    # daily, weekly, once
    weekday = Column(Integer, nullable=True)           # 0=Monday..6=Sunday, for weekly remedies
    source = Column(String(20), default="self")        # self, astrologer, suggested
    astrologer_name = Column(String(255), nullable=True)
    target_days = Column(Integer, nullable=True)       # e.g. 40 days, 11 weeks; None = ongoing
    link_type = Column(String(10), nullable=True)      # mall, seva
    link_ref = Column(String(120), nullable=True)      # product category / temple slug
    status = Column(String(10), default="active")      # active, completed, paused
    created_at = Column(DateTime(timezone=True), default=utc_now)


class RemedyLog(Base):
    __tablename__ = "remedy_logs"
    __table_args__ = (UniqueConstraint("task_id", "done_on", name="uq_remedy_log_day"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("remedy_tasks.id"), nullable=False, index=True)
    done_on = Column(String(10), nullable=False)       # YYYY-MM-DD in IST
    created_at = Column(DateTime(timezone=True), default=utc_now)


class GiftCard(Base):
    """Prepaid wallet credit one user buys for someone else; redeemed with the code."""
    __tablename__ = "gift_cards"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(20), unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    buyer_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    recipient_name = Column(String(120), nullable=True)
    message = Column(String(300), nullable=True)
    theme = Column(String(20), default="diwali")
    status = Column(String(10), default="ISSUED")      # ISSUED, REDEEMED
    redeemed_by = Column(String(36), nullable=True)
    redeemed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class FavouriteAstrologer(Base):
    """An astrologer a signed-in user has saved to come back to."""
    __tablename__ = "favourite_astrologers"
    __table_args__ = (UniqueConstraint("user_id", "astrologer_id", name="uq_favourite_astrologer"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    astrologer_id = Column(String(36), ForeignKey("astrologers.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Gaushala(Base):
    """A cow shelter that Gau Sewa donations are for. Donations stay disabled until an admin configures the recipient."""
    __tablename__ = "gaushalas"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    introduction = Column(Text, nullable=True)
    photos = Column(Text, nullable=True)                # JSON list of image URLs
    beneficiary_name = Column(String(255), nullable=True)   # who the money is passed to (shown on the page)
    beneficiary_details = Column(Text, nullable=True)       # plain-language note on how the funds reach the gaushala
    donations_enabled = Column(Boolean, default=False)      # admin switch; also needs beneficiary_name
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class GauSevaUpdate(Base):
    """A seva update (text + photos) published by an admin."""
    __tablename__ = "gau_seva_updates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    gaushala_id = Column(String(36), ForeignKey("gaushalas.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    photos = Column(Text, nullable=True)                # JSON list of image URLs
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Donation(Base):
    """One-time Gau Sewa donation. Kept apart from the wallet: a donation never credits wallet_balance."""
    __tablename__ = "donations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reference = Column(String(24), unique=True, index=True, nullable=False)       # shown to the donor, e.g. GS-1A2B3C4D5E
    receipt_token = Column(String(64), unique=True, index=True, nullable=False)   # unguessable; grants receipt access
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)  # null for guest donations
    donor_name = Column(String(120), nullable=False)
    donor_email = Column(String(255), nullable=True)
    hide_name_public = Column(Boolean, default=False)   # "keep my name out of public updates"; names are never public by default
    purpose = Column(String(20), nullable=False)        # chaara, chikitsa, general
    amount_paise = Column(Integer, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    gaushala_id = Column(String(36), ForeignKey("gaushalas.id"), nullable=True, index=True)
    recipient_name = Column(String(255), nullable=True)  # snapshot of the beneficiary at the time of the donation
    provider = Column(String(20), default="razorpay")
    provider_order_id = Column(String(64), unique=True, index=True, nullable=True)
    provider_payment_id = Column(String(64), unique=True, index=True, nullable=True)
    status = Column(String(12), default="PENDING", index=True)   # PENDING, SUCCESS, FAILED, REFUNDED
    refunded_paise = Column(Integer, default=0)
    failure_reason = Column(String(255), nullable=True)
    receipt_emailed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    refunded_at = Column(DateTime(timezone=True), nullable=True)


class PaymentWebhookEvent(Base):
    """Provider webhook deliveries already handled; the unique event id makes redelivery a no-op."""
    __tablename__ = "payment_webhook_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider = Column(String(20), nullable=False)
    event_id = Column(String(100), nullable=False)
    event_type = Column(String(60), nullable=True)
    received_at = Column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (UniqueConstraint("provider", "event_id", name="uq_webhook_provider_event"),)
