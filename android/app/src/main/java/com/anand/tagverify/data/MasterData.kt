package com.anand.tagverify.data

import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import java.util.Calendar

/** An RTO option, e.g. code "CG07", label "CG07 - RTO/ATS Durg". */
data class Rto(val code: String, val label: String)

/**
 * Dropdown lists for the fitment form. Bundled defaults so the form works
 * offline and before an admin sets anything; `load()` overrides them from
 * Firestore masters/dropdowns when present (arrays of strings; RTOs as
 * "CG07|RTO/ATS Durg").
 */
data class MasterData(
    val makes: List<String>,
    val categories: List<String>,
    val fuelTypes: List<String>,
    val rtos: List<Rto>,
    val mfgYears: List<String>,
) {
    companion object {
        private val currentYear = Calendar.getInstance().get(Calendar.YEAR)

        val DEFAULT = MasterData(
            makes = listOf(
                "Tata Motors", "Ashok Leyland", "Mahindra & Mahindra", "Eicher Motors", "BharatBenz",
                "Maruti Suzuki", "Hyundai", "Toyota", "Force Motors", "SML Isuzu", "Volvo", "Scania",
                "Bajaj", "Piaggio", "TVS", "Other",
            ),
            categories = listOf(
                "3 Wheeler", "Ambulance", "Bus", "Cab", "Fire Tender", "Goods Carriers", "HMV/HCV",
                "LMV/LCV", "School Bus", "Tractor/Trailer", "Other",
            ),
            fuelTypes = listOf("Diesel", "Petrol", "CNG", "LPG", "Electric", "Hybrid"),
            // Chhattisgarh RTOs — admin can replace via masters/dropdowns.rtos
            rtos = listOf(
                "CG04" to "Raipur", "CG05" to "Dhamtari", "CG06" to "Mahasamund", "CG07" to "Durg",
                "CG08" to "Rajnandgaon", "CG09" to "Kabirdham", "CG10" to "Bilaspur",
                "CG11" to "Janjgir-Champa", "CG12" to "Korba", "CG13" to "Raigarh", "CG14" to "Jashpur",
                "CG15" to "Ambikapur", "CG16" to "Koriya", "CG17" to "Jagdalpur", "CG18" to "Dantewada",
                "CG19" to "Kanker",
            ).map { (code, city) -> Rto(code, "$code - RTO/ATS $city") },
            mfgYears = (currentYear downTo currentYear - 35).map { it.toString() },
        )

        suspend fun load(db: FirebaseFirestore = FirebaseFirestore.getInstance()): MasterData = try {
            val doc = db.collection(Collections.MASTERS).document("dropdowns").get().await()
            @Suppress("UNCHECKED_CAST")
            fun list(key: String) = (doc.get(key) as? List<String>)?.filter { it.isNotBlank() }?.takeIf { it.isNotEmpty() }
            DEFAULT.copy(
                makes = list("makes") ?: DEFAULT.makes,
                categories = list("categories") ?: DEFAULT.categories,
                fuelTypes = list("fuelTypes") ?: DEFAULT.fuelTypes,
                rtos = list("rtos")?.map {
                    val (code, name) = it.split('|', limit = 2).let { p -> p[0].trim() to p.getOrElse(1) { "" }.trim() }
                    Rto(code, if (name.isBlank()) code else "$code - $name")
                } ?: DEFAULT.rtos,
                mfgYears = list("mfgYears") ?: DEFAULT.mfgYears,
            )
        } catch (e: Exception) {
            DEFAULT
        }
    }
}
