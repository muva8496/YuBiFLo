import 'package:flutter/material.dart';

/// Muva Fintech - Ambient Ledger Mode
/// Screen: Pending Drafts Queue Screen
/// Author: Principal Mobile Systems Architect & Lead ML Engineer
///
/// Features:
/// 1. Passive background audio transcriptions rendered as digestible swipeable cards.
/// 2. One-tap actions: [Approve], [Edit], and [Dismiss].
/// 3. Visual flags for Left-Behind items (`is_collected == false`) and Supplier Deliveries.
/// 4. Live AEC (Acoustic Echo Cancellation) & VAD active indicator pill.

class PendingDraft {
  final String id;
  final String transcript;
  final String intentType; // 'SALE' | 'CREDIT' | 'SUPPLIER_PURCHASE' | 'UNKNOWN'
  final String itemName;
  final double quantity;
  final String unit;
  final double amountPaid;
  final double balanceGiven;
  final String paymentMethod;
  final String counterparty;
  final bool isCollected;
  final DateTime timestamp;

  PendingDraft({
    required this.id,
    required this.transcript,
    required this.intentType,
    required this.itemName,
    required this.quantity,
    required this.unit,
    required this.amountPaid,
    required this.balanceGiven,
    required this.paymentMethod,
    required this.counterparty,
    required this.isCollected,
    required this.timestamp,
  });
}

class PendingDraftsQueueScreen extends StatefulWidget {
  const PendingDraftsQueueScreen({Key? key}) : super(key: key);

  @override
  State<PendingDraftsQueueScreen> createState() => _PendingDraftsQueueScreenState();
}

class _PendingDraftsQueueScreenState extends State<PendingDraftsQueueScreen> {
  // Mock live drafts populated via Android AmbientLedgerService stream
  final List<PendingDraft> _drafts = [
    PendingDraft(
      id: 'draft_001',
      transcript: 'Leo nikuwekee maziwa crate ngapi? Weka mbili tu, chukua pesa kwa M-Pesa.',
      intentType: 'SUPPLIER_PURCHASE',
      itemName: 'Brookside Fresh Milk',
      quantity: 2.0,
      unit: 'crates',
      amountPaid: 0.0,
      balanceGiven: 0.0,
      paymentMethod: 'MOBILE_MONEY',
      counterparty: 'Milk Supplier (Kibet)',
      isCollected: true,
      timestamp: DateTime.now().subtract(const Duration(minutes: 4)),
    ),
    PendingDraft(
      id: 'draft_002',
      transcript: 'Nipe yoghurt ya 35 na nitaipia kesho... sawa nimekuandika.',
      intentType: 'CREDIT',
      itemName: 'Ilara Strawberry Yoghurt 150ml',
      quantity: 1.0,
      unit: 'piece',
      amountPaid: 0.0,
      balanceGiven: 0.0,
      paymentMethod: 'CREDIT',
      counterparty: 'Mama Sharon (Neighbor)',
      isCollected: true,
      timestamp: DateTime.now().subtract(const Duration(minutes: 12)),
    ),
    PendingDraft(
      id: 'draft_003',
      transcript: 'Chukua elfu moja ya hii unga ya mia sita, nitarudi kuchukua jioni. Haya, change yako ni mia nne hii hapa.',
      intentType: 'SALE',
      itemName: 'Unga Jogoo 2kg Bale',
      quantity: 1.0,
      unit: 'bale',
      amountPaid: 1000.0,
      balanceGiven: 400.0,
      paymentMethod: 'CASH',
      counterparty: 'Pastor David',
      isCollected: false, // Customer left goods behind!
      timestamp: DateTime.now().subtract(const Duration(minutes: 25)),
    ),
  ];

  void _approveDraft(PendingDraft draft) {
    setState(() {
      _drafts.removeWhere((d) => d.id == draft.id);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF1FB88E),
        behavior: SnackBarBehavior.floating,
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.black, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Committed: ${draft.itemName} to official ledger!',
                style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _dismissDraft(PendingDraft draft) {
    setState(() {
      _drafts.removeWhere((d) => d.id == draft.id);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Colors.grey.shade900,
        behavior: SnackBarBehavior.floating,
        content: Text('Dismissed draft for ${draft.itemName}'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070E0B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0C1813),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Muva Ambient Ledger',
              style: TextStyle(
                fontFamily: 'serif',
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: Colors.white,
              ),
            ),
            Text(
              'Background Voice-to-Text Drafts Queue',
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          // Active Background Listener Pill
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF1FB88E).withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF1FB88E).withOpacity(0.4)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFF1FB88E),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                const Text(
                  'AEC & VAD LIVE',
                  style: TextStyle(
                    color: Color(0xFF1FB88E),
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: _drafts.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _drafts.length,
              itemBuilder: (context, index) {
                final draft = _drafts[index];
                return _buildDraftCard(draft);
              },
            ),
    );
  }

  Widget _buildDraftCard(PendingDraft draft) {
    Color intentColor;
    IconData intentIcon;

    switch (draft.intentType) {
      case 'SUPPLIER_PURCHASE':
        intentColor = const Color(0xFF38BDF8); // Cyan
        intentIcon = Icons.local_shipping;
        break;
      case 'CREDIT':
        intentColor = const Color(0xFFF59E0B); // Amber
        intentIcon = Icons.hourglass_top;
        break;
      case 'SALE':
      default:
        intentColor = const Color(0xFF1FB88E); // Emerald
        intentIcon = Icons.shopping_bag;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F1A15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // CARD HEADER
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF14241D),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Row(
                  children: [
                    Icon(intentIcon, color: intentColor, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      draft.intentType.replaceAll('_', ' '),
                      style: TextStyle(
                        color: intentColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
                Text(
                  draft.counterparty,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // RAW OVERHEARD AUDIO QUOTE
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF08100C),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.mic_none, color: Colors.grey, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '"${draft.transcript}"',
                          style: const TextStyle(
                            fontStyle: FontStyle.italic,
                            color: Colors.grey,
                            fontSize: 12,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // DETECTED PARSED ITEMS & PRICING
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${draft.quantity} ${draft.unit} &bull; ${draft.itemName}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Paid: KSh ${draft.amountPaid.toStringAsFixed(0)} via ${draft.paymentMethod}',
                          style: const TextStyle(color: Color(0xFF1FB88E), fontSize: 12),
                        ),
                      ],
                    ),
                    if (draft.balanceGiven > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.amber.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Change: KSh ${draft.balanceGiven.toStringAsFixed(0)}',
                          style: const TextStyle(color: Colors.amber, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                  ],
                ),

                // CRITICAL FLAG: LEFT-BEHIND DEFERRED COLLECTION BADGE
                if (!draft.isCollected) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.purple.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.purple.withOpacity(0.4)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.inventory_2, color: Colors.purpleAccent, size: 14),
                        SizedBox(width: 6),
                        Text(
                          'Left-Behind for Later Pickup (Stock Reserved)',
                          style: TextStyle(color: Colors.purpleAccent, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 16),

                // ONE-TAP ACTION BUTTON BAR
                Row(
                  children: [
                    // DISMISS BUTTON
                    OutlinedButton(
                      onPressed: () => _dismissDraft(draft),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.grey,
                        side: BorderSide(color: Colors.grey.shade800),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Dismiss', style: TextStyle(fontSize: 12)),
                    ),
                    const SizedBox(width: 8),

                    // EDIT BUTTON
                    OutlinedButton(
                      onPressed: () {},
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF1FB88E),
                        side: const BorderSide(color: Color(0xFF1FB88E)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Edit', style: TextStyle(fontSize: 12)),
                    ),
                    const Spacer(),

                    // APPROVE & COMMIT BUTTON
                    ElevatedButton.icon(
                      onPressed: () => _approveDraft(draft),
                      icon: const Icon(Icons.check, size: 16, color: Colors.black),
                      label: const Text(
                        'Approve Draft',
                        style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1FB88E),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.hearing_outlined, size: 56, color: Colors.grey.shade700),
          const SizedBox(height: 16),
          const Text(
            'Ambient Ledger Listening...',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          const Text(
            'Overheard counter transactions will queue here for 1-tap review.',
            style: TextStyle(color: Colors.grey, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
