# EMAIL DELIVERABILITY BEST PRACTICES
## Implementation Guide for MailGenPro

### 1. TECHNICAL INFRASTRUCTURE

#### SPF (Sender Policy Framework)
- Add SPF record to DNS: `v=spf1 include:_spf.google.com ~all`
- Authorizes which mail servers can send on behalf of your domain

#### DKIM (DomainKeys Identified Mail)
- Generate DKIM keys and add to DNS
- Signs emails cryptographically to prove authenticity
- Implementation: Use email service provider's DKIM setup

#### DMARC (Domain-based Message Authentication)
- Add DMARC record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com`
- Tells receiving servers what to do with failed SPF/DKIM checks

#### Dedicated IP Address
- Use a dedicated IP for sending (not shared)
- Warm up the IP gradually (start with low volume, increase over weeks)

---

### 2. EMAIL CONTENT BEST PRACTICES

#### Avoid Spam Trigger Words
**Never use:**
- "Free", "Act now", "Limited time", "Click here"
- "Guaranteed", "No risk", "Winner", "Congratulations"
- Excessive exclamation marks (!!!)
- ALL CAPS SUBJECT LINES

#### HTML Best Practices
- Keep HTML simple and clean
- Avoid excessive images (text-to-image ratio should be 60:40)
- Don't use JavaScript or forms in emails
- Use inline CSS (not external stylesheets)
- Include alt text for all images

#### Plain Text Version
- Always include a plain text version alongside HTML
- Many spam filters check for this

#### Unsubscribe Link
- **MANDATORY**: Include clear, working unsubscribe link
- CAN-SPAM Act requirement
- Place in footer, make it visible

---

### 3. SENDING BEHAVIOR

#### Gradual Volume Increase
- Day 1-7: Send 50-100 emails/day
- Week 2: 200-500 emails/day
- Week 3: 1,000 emails/day
- Week 4+: Scale to desired volume

#### Engagement Monitoring
- Track opens, clicks, bounces, spam complaints
- Remove hard bounces immediately
- Suppress users who don't engage (after 6 months)

#### List Hygiene
- Use double opt-in for subscribers
- Remove invalid emails before sending
- Segment lists (don't send same content to everyone)

---

### 4. AUTHENTICATION & REPUTATION

#### Email Service Provider
**Recommended:**
- SendGrid (good for transactional)
- Amazon SES (cost-effective, scalable)
- Postmark (high deliverability)
- Mailgun (developer-friendly)

**Avoid:**
- Sending directly from your server
- Free email services (Gmail, Yahoo for bulk)

#### Sender Reputation
- Monitor sender score: [SenderScore.org](https://senderscore.org)
- Check blacklists: [MXToolbox](https://mxtoolbox.com/blacklists.aspx)
- Maintain low bounce rate (<2%)
- Keep spam complaint rate <0.1%

---

### 5. CONTENT GENERATION RULES (FOR AI)

#### Subject Lines
- Keep under 50 characters
- Avoid spam words
- Personalize when possible
- Don't use misleading subjects

#### Email Body
- Start with recipient's name (personalization)
- Clear, concise value proposition
- Single, clear call-to-action
- Professional formatting
- Include physical mailing address (CAN-SPAM requirement)

#### Footer Requirements
```
Company Name
Physical Address
Unsubscribe Link
Privacy Policy Link
```

---

### 6. TESTING BEFORE SENDING

#### Spam Score Testing
- Use [Mail-Tester.com](https://www.mail-tester.com)
- Send test email, get score (aim for 8+/10)
- Fix issues before bulk sending

#### Inbox Placement Testing
- Test across Gmail, Outlook, Yahoo, Apple Mail
- Use tools like Litmus or Email on Acid
- Check mobile rendering

---

### 7. IMPLEMENTATION CHECKLIST

- [ ] Set up SPF, DKIM, DMARC records
- [ ] Choose and configure email service provider
- [ ] Implement double opt-in for subscribers
- [ ] Add unsubscribe functionality
- [ ] Include physical address in footer
- [ ] Create plain text version of all emails
- [ ] Implement bounce handling
- [ ] Set up engagement tracking
- [ ] Create IP warm-up schedule
- [ ] Monitor sender reputation weekly
- [ ] A/B test subject lines and content
- [ ] Segment email lists
- [ ] Remove inactive subscribers quarterly

---

### 8. ONGOING MONITORING

**Daily:**
- Check bounce rate
- Monitor spam complaints

**Weekly:**
- Review engagement metrics (open/click rates)
- Check sender score

**Monthly:**
- Clean email list (remove hard bounces)
- Review and update content strategy
- Test deliverability across providers

---

### 9. EMERGENCY PROCEDURES

**If Deliverability Drops:**
1. Stop sending immediately
2. Check if IP/domain is blacklisted
3. Review recent email content for spam triggers
4. Contact ESP support
5. Request delisting if blacklisted
6. Implement fixes before resuming

**If Spam Complaints Spike:**
1. Pause campaign
2. Review content for spam triggers
3. Verify list quality (no purchased lists)
4. Ensure unsubscribe link works
5. Segment list to engaged users only

---

### 10. LEGAL COMPLIANCE

#### CAN-SPAM Act (US)
- Don't use false/misleading headers
- Don't use deceptive subject lines
- Identify message as an ad
- Include physical postal address
- Provide opt-out mechanism
- Honor opt-outs within 10 days

#### GDPR (EU)
- Obtain explicit consent
- Provide clear privacy policy
- Allow data export/deletion
- Keep consent records

---

## RECOMMENDED IMPLEMENTATION ORDER

1. **Week 1**: Set up DNS records (SPF, DKIM, DMARC)
2. **Week 2**: Integrate email service provider (SendGrid/SES)
3. **Week 3**: Implement unsubscribe & bounce handling
4. **Week 4**: Start IP warm-up with small volume
5. **Week 5+**: Scale gradually while monitoring metrics

---

## KEY METRICS TO TRACK

- **Delivery Rate**: >95% (emails that reach inbox)
- **Open Rate**: 15-25% (industry average)
- **Click Rate**: 2-5%
- **Bounce Rate**: <2%
- **Spam Complaint Rate**: <0.1%
- **Unsubscribe Rate**: <0.5%

---

## TOOLS & RESOURCES

- **Spam Testing**: Mail-Tester, SpamAssassin
- **Deliverability**: GlockApps, 250ok
- **Blacklist Check**: MXToolbox, MultiRBL
- **Sender Score**: SenderScore.org
- **Email Testing**: Litmus, Email on Acid
